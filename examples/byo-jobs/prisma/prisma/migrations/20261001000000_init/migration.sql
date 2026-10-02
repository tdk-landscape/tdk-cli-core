-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "item" TEXT NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
