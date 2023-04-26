import {MediaType, PaymentMethod, PrismaClient} from '@prisma/client'
import {createPasswordHash} from '../app/utils/misc'

const prisma = new PrismaClient()

async function seed() {
	await prisma.user.deleteMany()
	await prisma.media.deleteMany()

	const user = await prisma.user.create({
		data: {
			email: 'demo@ucmo.edu',
			name: 'Demo User',
			passwordHash: await createPasswordHash('demoaccount'),
		},
	})

	const media = await prisma.media.create({
		data: {
			title: 'The Matrix',
			description: 'A movie about a hacker',
			type: MediaType.MOVIE,
			link: 'https://www.youtube.com/watch?v=m8e-FF8MsqU',
			category: {
				set: ['Action', 'Sci-Fi'],
			},
		},
	})

	await prisma.media.createMany({
		data: [
			{
				title: 'The Matrix',
				description: 'A movie about a hacker',
				type: MediaType.MOVIE,
				link: 'https://www.youtube.com/watch?v=m8e-FF8MsqU',
				category: {
					set: ['Action', 'Sci-Fi'],
				},
			},
			{
				title: 'The Beatles: Eight Days a Week',
				description: 'A documentary about the Beatles',
				type: MediaType.MOVIE,
				link: 'https://www.youtube.com/watch?v=6JYIGclVQdw',
				category: {
					set: ['Documentary', 'Music'],
				},
			},
			{
				title: 'Hybrid Theory',
				description: "Linkin Park's first album Hybrid Theory",
				type: MediaType.MUSIC,
				link: 'https://www.youtube.com/watch?v=KDYzrI7rQ8c',
				category: {
					set: ['Rock'],
				},
			},
		],
	})

	await prisma.transaction.create({
		data: {
			userId: user.id,
			mediaId: media.id,
			borrowedAt: new Date(),
			link: {
				create: {
					mediaId: media.id,
					sharableLink: 'https://www.youtube.com/watch?v=m8e-FF8MsqU',
				},
			},
			dueDate: new Date(Date.now() + 6048e5),
			// three days later than now
			returnedAt: new Date(Date.now() + 6048e5 + 864e5),
			payment: {
				set: {
					amount: 10,
					method: PaymentMethod.CREDIT_CARD,
					status: 'PAID',
				},
			},
		},
	})

	console.log(`Database has been seeded. 🌱`)
}

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
