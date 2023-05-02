import {Media, PaymentMethod, PaymentStatus} from '@prisma/client'
import {LoaderArgs, json} from '@remix-run/node'
import {db} from '~/lib/prisma.server'

export const action = async ({request}: LoaderArgs) => {
	const formData = await request.formData()

	const name = formData.get('name')?.toString()

	if (!name) {
		return json({success: false, message: 'Invalid request'})
	}

	await db.category.create({
		data: {
			name: name,
		},
	})

	return json({success: true})
}
