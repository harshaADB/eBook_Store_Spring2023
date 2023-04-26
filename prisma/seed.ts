import {MediaType, PrismaClient, Role} from '@prisma/client'
import {createPasswordHash} from '../app/utils/misc'

const prisma = new PrismaClient()

async function seed() {
	await prisma.user.deleteMany()
	await prisma.media.deleteMany()

	await prisma.user.create({
		data: {
			email: 'demo@ucmo.edu',
			name: 'Demo User',
			passwordHash: await createPasswordHash('demoaccount'),
			role: Role.USER,
		},
	})

	await prisma.user.create({
		data: {
			email: 'admin@ucmo.edu',
			name: 'Admin User',
			passwordHash: await createPasswordHash('adminaccount'),
			role: Role.ADMIN,
		},
	})

	await prisma.media.createMany({
		data: [
			{
				title: 'The Matrix',
				description: 'A movie about a hacker',
				type: MediaType.MOVIE,
				link: 'https://www.youtube.com/watch?v=9ix7TUGVYIo',
				rentPerDay: 3,
				category: {
					set: ['Action', 'Sci-Fi'],
				},
			},
			{
				title: 'The Beatles: Eight Days a Week',
				description: 'A documentary about the Beatles',
				type: MediaType.MOVIE,
				link: 'https://www.youtube.com/watch?v=kle2xHhRHg4',
				rentPerDay: 4,
				category: {
					set: ['Documentary', 'Music'],
				},
			},
			{
				title: 'Hybrid Theory',
				description: "Linkin Park's first album Hybrid Theory",
				type: MediaType.MUSIC,
				link: 'https://www.youtube.com/watch?v=2UnWZMsTwHA',
				rentPerDay: 5,
				category: {
					set: ['Rock'],
				},
			},
		],
	})

	// await prisma.transaction.create({
	// 	data: {
	// 		user: {
	// 			connect: {
	// 				id: user.id,
	// 			},
	// 		},
	// 		media: {
	// 			connect: {
	// 				id: media.id,
	// 			},
	// 		},
	// 		borrowedAt: new Date(),
	// 		returnedAt: new Date(Date.now() + 6048e5 + 864e5),
	// 		link: {
	// 			create: {
	// 				mediaId: media.id,
	// 				expired: true,
	// 			},
	// 		},
	// 		payment: {
	// 			create: {
	// 				amount: 10,
	// 				method: PaymentMethod.CREDIT_CARD,
	// 				status: 'PAID',
	// 			},
	// 		},
	// 	},
	// })
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
