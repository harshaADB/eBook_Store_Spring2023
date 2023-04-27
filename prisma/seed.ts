import {MediaType, PrismaClient, Role} from '@prisma/client'
import {createPasswordHash} from '../app/utils/misc'

const prisma = new PrismaClient()

async function seed() {
	await prisma.user.deleteMany()
	await prisma.media.deleteMany()

	await prisma.user.create({
		data: {
			email: 'demo@app.com',
			name: 'Demo User',
			passwordHash: await createPasswordHash('password'),
			role: Role.USER,
		},
	})

	await prisma.user.create({
		data: {
			email: 'admin@app.com',
			name: 'Admin User',
			passwordHash: await createPasswordHash('password'),
			role: Role.ADMIN,
		},
	})

	await prisma.media.createMany({
		data: [
			{
				title: 'The Matrix',
				description: 'A movie about a hacker',
				type: MediaType.BOOK,
				link: 'https://www.africau.edu/images/default/sample.pdf',
				rentPerDay: 3,
				category: {
					set: ['Action', 'Sci-Fi'],
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
