const fs = require('fs');
const path = require('path');

const databaseDir = path.join(__dirname, 'database');
const usuariosFile = path.join(databaseDir, 'usuarios.json');
const pessoasFile = path.join(databaseDir, 'pessoas.json');

function ensureDatabase() {
  if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
  }

  if (!fs.existsSync(usuariosFile) || fs.statSync(usuariosFile).size === 0) {
    const usuarios = [
      {
        usuario: 'admin',
        senha: '1234',
        nome: 'Administrador'
      }
    ];

    fs.writeFileSync(usuariosFile, JSON.stringify(usuarios, null, 2), 'utf8');
  }

  if (!fs.existsSync(pessoasFile) || fs.statSync(pessoasFile).size === 0) {
    fs.writeFileSync(pessoasFile, '[]', 'utf8');
  }

  console.log('Banco gerado com sucesso.');
  console.log('Arquivo de usuários:', usuariosFile);
  console.log('Arquivo de pessoas:', pessoasFile);
  console.log('Usuário padrão: admin / 1234');
}

ensureDatabase();
