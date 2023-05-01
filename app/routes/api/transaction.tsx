import {Media} from '@prisma/client'
import {LoaderArgs, json} from '@remix-run/node'
import {rentMedia} from '~/lib/transaction.server'

export const action = async ({request}: LoaderArgs) => {
	const formData = await request.formData()

	const mediaArray = formData.get('media[]')?.toString()
	const userId = formData.get('userId')?.toString()

	if (!mediaArray || !userId) {
		return null
	}

	const media = JSON.parse(mediaArray) as Media[]

	await Promise.all(
		media.map(async media => {
			await rentMedia({mediaId: media.id, userId})
		})
	)

	return json({success: true})
}
