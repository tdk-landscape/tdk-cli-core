const { DataSource } = require('typeorm');

// TDK's DATABASE_URL ends in a Prisma-style ?schema=public; node-postgres ignores unknown parameters,
// so it is stripped here only to keep the URL unambiguous. TDK's Postgres has SSL off (the default here).
module.exports = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL.split('?')[0],
  migrations: [__dirname + '/migrations/*.js'],
});
