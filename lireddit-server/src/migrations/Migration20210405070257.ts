import { Migration } from '@mikro-orm/migrations';

export class Migration20210405070257 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "user" ("id" serial primary key, "username" text not null, "password" text not null, "first_name" text not null, "last_name" text not null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null);');
    this.addSql('alter table "user" add constraint "user_username_unique" unique ("username");');
  }

}
