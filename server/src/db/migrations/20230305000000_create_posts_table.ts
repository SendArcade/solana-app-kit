
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create the "posts" table
  await knex.schema.createTable('posts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('parent_id').references('id').inTable('posts').nullable().onDelete('CASCADE');
    table.string('user_id').notNullable();
    table.text('username').notNullable(); 
    table.string('user_handle').notNullable();
    table.boolean('user_verified').defaultTo(false);
    table.jsonb('sections').notNullable().defaultTo('[]');
    table.integer('reaction_count').defaultTo(0);
    table.integer('retweet_count').defaultTo(0);
    table.integer('quote_count').defaultTo(0);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('posts');
}
