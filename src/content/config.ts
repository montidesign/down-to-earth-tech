import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		excerpt: z.string().optional(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		author: z.string().default('Down to Earth Technology'),
		category: z.string(),
		categorySlug: z.string(),
		featuredImage: z.string().optional(),
		featuredImageAlt: z.string().optional(),
		draft: z.boolean().default(false),
	}),
});

export const collections = {
	posts: postsCollection,
};
