import {Media, PaymentMethod, PaymentStatus} from '@prisma/client'
import {LoaderArgs, json} from '@remix-run/node'
import {db} from '~/lib/prisma.server'

export const action = async ({request}: LoaderArgs) => {
	const formData = await request.formData()

	const mediaArray = formData.get('media[]')?.toString()
	const userId = formData.get('userId')?.toString()
	const paymentMethod = formData.get('paymentMethod')?.toString()

	console.log(Object.fromEntries(formData.entries()))

	if (!mediaArray || !userId || !paymentMethod) {
		return json({success: false, message: 'Invalid request'})
	}

	const media = JSON.parse(mediaArray) as Media[]

	await Promise.all(
		media.map(async media => {
			await db.transaction.create({
				data: {
					user: {
						connect: {
							id: userId,
						},
					},
					link: {
						create: {
							mediaId: media.id,
							expired: false,
						},
					},
					media: {
						connect: {
							id: media.id,
						},
					},
					amount: media.rentPerDay,
					paymentStatus: PaymentStatus.PAID,
					borrowedAt: new Date(),
					payment: {
						create: {
							amount: media.rentPerDay,
							method: paymentMethod as PaymentMethod,
							status: PaymentStatus.PAID,
							userId: userId,
						},
					},
				},
			})
		})
	)

	return json({success: true})
}
