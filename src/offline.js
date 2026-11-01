// Saves por conta. O disco é atualizado antes de qualquer pedido de rede.
// updated_at é usado como condição atômica (compare-and-swap) no Supabase.
const clone = value => JSON.parse(JSON.stringify(value));
const revision = value => value?.replace('+00:00', 'Z').replace(/(?:\.(\d+))?Z$/, (_, digits = '') => '.' + digits.padEnd(6, '0') + 'Z');

export class OfflineSaves {
  constructor(storage) { this.storage = storage; }
  key(owner) { return 'peregrinos.saves.v1.' + owner; }
  read(owner) {
    const raw = this.storage.getItem(this.key(owner));
    // Não substituir silenciosamente um arquivo corrompido por um save vazio.
    return raw ? JSON.parse(raw) : {};
  }
  write(owner, entries) { this.storage.setItem(this.key(owner), JSON.stringify(entries)); }
  list(owner) { return Object.values(this.read(owner)).map(e => ({ ...clone(e.char), _owner: owner, _saveVersion: e.version })); }
  backup(owner, id, value) {
    this.storage.setItem(this.key(owner) + '.backup.' + id + '.' + Date.now(), JSON.stringify(value));
  }
  refresh(owner, rows) {
    const entries = this.read(owner), found = new Set(rows.map(c => c.id));
    for (const c of rows) {
      const e = entries[c.id];
      if (!e?.pending && (!e || revision(e.base) !== revision(c.updated_at))) entries[c.id] = { char: clone(c), base: c.updated_at, version: (e?.version || 0) + 1, pending: false };
    }
    for (const id of Object.keys(entries)) if (!found.has(id) && !entries[id].pending) delete entries[id];
    this.write(owner, entries);
    return this.list(owner);
  }
  remember(owner, c) {
    const entries = this.read(owner);
    entries[c.id] = { char: clone(c), base: c.updated_at, version: 1, pending: false };
    this.write(owner, entries);
    return this.list(owner).find(x => x.id === c.id);
  }
  stage(owner, c) {
    if (c._owner !== owner) throw new Error('Este personagem pertence a outra conta. Volte à seleção de personagens.');
    const entries = this.read(owner), e = entries[c.id];
    if (!e || c._saveVersion !== e.version) {
      this.backup(owner, c.id, c);
      throw new Error('Este personagem mudou em outra aba. Uma cópia foi preservada; volte à seleção antes de continuar.');
    }
    const snapshot = clone(c); delete snapshot._owner; delete snapshot._saveVersion;
    e.char = snapshot; e.pending = true; e.version++;
    this.write(owner, entries); c._saveVersion = e.version;
  }
  forget(owner, id) { const entries = this.read(owner); delete entries[id]; this.write(owner, entries); }
  status(owner) {
    const entries = Object.values(this.read(owner));
    return { pending: entries.filter(e => e.pending).length, conflicts: entries.filter(e => e.conflict).length };
  }
  conflict(owner, id) { return this.read(owner)[id]?.conflict; }
  resolve(owner, id, choice) {
    const entries = this.read(owner), e = entries[id];
    if (!e?.conflict) return;
    this.backup(owner, id, e); // preserva ambas as versões antes da escolha
    const remote = e.conflict.remote;
    if (choice === 'cloud') {
      if (remote) entries[id] = { char: remote, base: remote.updated_at, version: e.version + 1, pending: false };
      else delete entries[id];
    } else {
      if (!remote) throw new Error('O personagem foi apagado na nuvem. Exporte a cópia deste aparelho antes de descartá-la.');
      if (e.char.level < remote.level || e.char.score < remote.score) throw new Error('A nuvem tem nível ou pontuação maior. Exporte a cópia local e escolha a nuvem; o servidor não permite reduzir esses valores.');
      e.base = remote.updated_at; e.conflict = null; e.attempt = null;
    }
    this.write(owner, entries);
  }
  async sync(owner, transport) {
    for (const id of Object.keys(this.read(owner))) {
      // Grandes períodos offline respeitam o limite de 20 mil pontos por atualização
      // já imposto pelo servidor. O snapshot só é confirmado quando chegar ao total.
      for (let step = 0; step < 100; step++) {
        let e = this.read(owner)[id];
        if (!e?.pending || e.conflict) break;
        const remote = await transport.read(id);
        let entries = this.read(owner); e = entries[id];
        if (!e?.pending || e.conflict) break;
        if (e.attempt && remote && revision(remote.updated_at) === revision(e.attempt.revision)) {
          e.base = remote.updated_at;
          if (e.version === e.attempt.version && remote.score === e.char.score) e.pending = false;
          e.attempt = null; this.write(owner, entries);
          if (!e.pending) break;
        }
        if (!remote || revision(remote.updated_at) !== revision(e.base)) {
          e.conflict = { remote }; this.write(owner, entries); break;
        }
        const snapshot = clone(e.char);
        snapshot.score = Math.min(snapshot.score, remote.score + 20000);
        const next = new Date(Math.max(Date.now(), Date.parse(e.base) + 1)).toISOString();
        e.attempt = { revision: next, version: e.version };
        this.write(owner, entries); // recibo durável: permite repetir após resposta perdida
        const saved = await transport.write(id, snapshot, e.base, next);
        if (!saved) continue; // outro aparelho venceu a condição; reler e preservar conflito
        entries = this.read(owner); e = entries[id];
        if (!e) break;
        e.base = saved.updated_at;
        if (e.version === e.attempt?.version && saved.score === e.char.score) e.pending = false;
        e.attempt = null; this.write(owner, entries);
      }
    }
  }
}
