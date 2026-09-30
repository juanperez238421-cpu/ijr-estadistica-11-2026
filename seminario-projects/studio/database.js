(()=>{
 // The same real IndexedDB adapter runs in exported standalone HTML.
 async function openDatabase(project){
  const kind=project==='clients'?'clients':'gta';
  const connection=await new Promise((resolve,reject)=>{const q=indexedDB.open('ijr-seminar-'+kind+'-v1',1);q.onupgradeneeded=()=>{const s=q.result.createObjectStore('records',{keyPath:'id',autoIncrement:true});s.createIndex('uniqueKey','uniqueKey',{unique:true});};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);q.onblocked=()=>reject(new Error('Cierra otras pestañas del registro para abrir la base local.'));});
  function validate(row){
   if(!row||typeof row!=='object')throw new Error('Registro inválido');
   const fields=kind==='clients'?['name','email','phone']:['name','category','build','requirements'];const record={};
   for(const f of fields){record[f]=String(row[f]??'').trim();if(!record[f]||record[f].length>240)throw new Error('Completa '+f+' (máximo 240 caracteres).');}
   if(kind==='clients'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email))throw new Error('Correo inválido');
   if(kind==='gta'&&!['graphics','vehicles','tools'].includes(record.category))throw new Error('Categoría inválida');
   record.uniqueKey=(kind==='clients'?record.email:record.name).toLowerCase();return record;
  }
  return async function db(op,row){
   if(!['list','add','delete'].includes(op))throw new Error('Operación inválida');
   let record;if(op==='add')record=validate(row);
   if(op==='delete'){row=typeof row==='object'?row?.id:row;if(!Number.isSafeInteger(row)||row<1)throw new Error('ID inválido');}
   return new Promise((resolve,reject)=>{const tx=connection.transaction('records',op==='list'?'readonly':'readwrite'),s=tx.objectStore('records');let value;const q=op==='list'?s.getAll():op==='add'?s.add(record):s.delete(row);q.onsuccess=()=>value=op==='add'?{...record,id:q.result}:q.result;tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(new Error(tx.error?.name==='ConstraintError'?'Registro duplicado':tx.error?.message||'Error de base de datos'));tx.onabort=()=>reject(new Error(tx.error?.name==='ConstraintError'?'Registro duplicado':'Transacción cancelada'));});
  };
 }
 window.STUDIO_DB={openDatabase,standaloneSource:()=>openDatabase.toString()};
})();
