
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.string('id').primary(); // use wallet address as the id
    table.string('username').notNullable();
    table.string('handle').notNullable();
    table.string('profile_picture_url').nullable();
    table.timestamps(true, true); // created_at & updated_at
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}
