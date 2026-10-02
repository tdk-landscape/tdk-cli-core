const { Migration } = require('@mikro-orm/migrations');

module.exports.Migration20261001000000 = class Migration20261001000000 extends Migration {
  async up() {
    this.addSql('create table "orders" ("id" serial primary key, "item" text not null);');
  }

  async down() {
    this.addSql('drop table if exists "orders" cascade;');
  }
};
