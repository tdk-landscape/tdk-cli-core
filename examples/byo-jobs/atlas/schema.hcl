schema "public" {}

table "orders" {
  schema = schema.public
  column "id" {
    type = serial
  }
  column "item" {
    type = text
    null = false
  }
  primary_key {
    columns = [column.id]
  }
}
