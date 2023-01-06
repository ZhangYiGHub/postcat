const { readFileSync } = require('fs');

const { Client } = require('ssh2');

const conn = new Client();
conn
  .on('ready', () => {
    console.log('Client :: ready');
    conn.shell((err, stream) => {
      if (err) throw err;

      stream
        .on('close', () => {
          console.log('stream CLOSED');
          conn.end();
          process.exit();
        })
        .on('data', data => {
          console.log(data.toString());
        })
        .end(['set TERM=msys', 'd:', `cd \\git\\postcat`, 'nvm use 16.13.2', 'yarn build:static', 'nvm use 12.22.10', 'exit'].join('\r\n'));
    });
  })
  .connect({
    host: '10.8.0.130',
    username: 'root',
    password: '520123'
  });