module.exports = class CreateOrders1759300000000 {
  name = 'CreateOrders1759300000000';

  async up(queryRunner) {
    await queryRunner.query('CREATE TABLE "orders" ("id" SERIAL NOT NULL, "item" text NOT NULL, CONSTRAINT "PK_orders" PRIMARY KEY ("id"))');
  }

  async down(queryRunner) {
    await queryRunner.query('DROP TABLE "orders"');
  }
};
