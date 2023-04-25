import type {LoaderArgs} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import {useLoaderData} from '@remix-run/react'
import {requireUserId} from '~/lib/session.server'
import {getMedia} from '~/lib/transaction.server'

export const loader = async ({request, params}: LoaderArgs) => {
	const userId = await requireUserId(request)
	const token = params.token

	if (!token) {
		throw json('Not authorized', {status: 403})
	}

	const {isValidToken, media} = await getMedia({
		token,
		userId,
	})

	if (!isValidToken) {
		throw redirect('/')
	}

	return json({media})
}

export default function ViewMedia() {
	const {media} = useLoaderData<typeof loader>()
	return (
		<>
			<div className="px-4 sm:px-6 lg:px-8 mt-8">
				<div className="sm:flex-auto sm:flex sm:items-center sm:justify-between">
					<div>
						<h1 className="text-xl font-semibold text-gray-900">
							{media?.title}
						</h1>
						<p className="mt-2 text-sm text-gray-700">{media?.description}</p>
					</div>
				</div>

				<div className="mt-8 flex flex-col">
					<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
						<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
							<iframe src={media?.link} title="PDF" height={600} width={1000} />
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
