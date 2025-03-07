import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add a nullable retweet_of column referencing posts.id
  await knex.schema.alterTable('posts', table => {
    table
      .uuid('retweet_of')
      .nullable()
      .references('id')
      .inTable('posts')
      .onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', table => {
    table.dropColumn('retweet_of');
  });
}
