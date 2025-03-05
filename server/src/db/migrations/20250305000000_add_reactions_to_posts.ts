// FILE: 20250305000000_add_reactions_to_posts.ts

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table('posts', (table) => {
    table.jsonb('reactions').notNullable().defaultTo('{}');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('posts', (table) => {
    table.dropColumn('reactions');
  });
}
