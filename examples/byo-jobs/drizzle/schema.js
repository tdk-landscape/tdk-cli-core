const { pgTable, serial, text } = require('drizzle-orm/pg-core');

module.exports.orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  item: text('item').notNull(),
});
