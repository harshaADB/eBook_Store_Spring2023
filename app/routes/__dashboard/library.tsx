import {MagnifyingGlassIcon} from '@heroicons/react/24/outline'
import {Badge, Button, TextInput} from '@mantine/core'
import type {Media} from '@prisma/client'
import {Role} from '@prisma/client'
import type {ActionArgs, LoaderArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {redirect} from '@remix-run/node'
import {useFetcher} from '@remix-run/react'
import * as React from 'react'
import {requireUser, requireUserId} from '~/lib/session.server'
import {rentMedia} from '~/lib/transaction.server'
import {useCart} from '~/utils/CartContext'
import {useDashboardData, useOptionalUser} from '~/utils/hooks'
import {formatList, titleCase} from '~/utils/string'

export const loader = async ({request}: LoaderArgs) => {
	const user = await requireUser(request)

	if (user.role === Role.ADMIN) {
		return redirect('/admin')
	}

	return json({})
}

export const action = async ({request}: ActionArgs) => {
	const userId = await requireUserId(request)
	const formData = await request.formData()

	const mediaId = formData.get('mediaId')?.toString()

	if (!mediaId) {
		return null
	}

	return rentMedia({mediaId, userId})
		.then(() => redirect('/'))
		.catch(_e => {
			// handle error here
			return null
		})
}

export default function Library() {
	const {allMedia} = useDashboardData()

	const [query, setQuery] = React.useState('')
	const [filteredMedia, setFilteredMedia] = React.useState<Media[]>(allMedia)

	React.useEffect(() => {
		if (!query || query?.length <= 2) {
			setFilteredMedia(allMedia)
			return
		}

		const filtered = allMedia.filter(media => {
			return (
				media.title.toLowerCase().includes(query.toLowerCase()) ||
				media.type.toLowerCase().includes(query.toLowerCase()) ||
				media.description.toLowerCase().includes(query.toLowerCase())
			)
		})

		setFilteredMedia(filtered)
	}, [allMedia, query])

	return (
		<>
			<div className="px-4 sm:px-6 lg:px-8 mt-8">
				<div className="sm:flex-auto sm:flex sm:items-center sm:justify-between">
					<div>
						<h1 className="text-xl font-semibold text-gray-900">Media</h1>
						<p className="mt-2 text-sm text-gray-700">
							A list of all the media currently present in our library.
						</p>
					</div>

					<div>
						<TextInput
							placeholder="Search by title or type"
							value={query}
							onChange={e => setQuery(e.currentTarget.value)}
							icon={<MagnifyingGlassIcon className="h-4 w-4" />}
						/>
					</div>
				</div>

				<div className="mt-8 flex flex-col">
					<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
						<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
							<table className="min-w-full divide-y divide-gray-300">
								<thead>
									<tr>
										<th
											scope="col"
											className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
										>
											Title
										</th>
										<th
											scope="col"
											className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell"
										>
											Type
										</th>
										<th
											scope="col"
											className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell"
										>
											Rent
										</th>
										<th
											scope="col"
											className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell"
										>
											Category
										</th>
										<th
											scope="col"
											className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0"
										>
											<span className="sr-only">Actions</span>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{filteredMedia.map(m => (
										<MediaRow key={m.id} media={m} />
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

function MediaRow({media}: {media: Media}) {
	const fetcher = useFetcher<typeof action>()
	const {user} = useOptionalUser()
	const {rentedMedia} = useDashboardData()
	const {addItemToCart, itemsInCart} = useCart()

	const rentMedia = (mediaId: Media['id']) => {
		fetcher.submit(
			{mediaId},
			{
				method: 'post',
				replace: true,
			}
		)
	}

	const isRentedByUser = rentedMedia.some(m => m.media.id === media.id)
	const isSubmitting = fetcher.state !== 'idle'

	return (
		<tr>
			<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
				{media.title}
			</td>
			<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500 hidden sm:table-cell">
				{titleCase(media.type)}
			</td>
			<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500 hidden sm:table-cell">
				${media.rentPerDay.toFixed(2)}
			</td>
			<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500 hidden sm:table-cell">
				{formatList(media.category)}
			</td>
			<td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 md:pr-0 space-x-4">
				{user ? (
					<div className="flex gap-6 items-center">
						{isRentedByUser ? (
							<Badge color="red">Already rented</Badge>
						) : (
							<Button
								variant="filled"
								loading={isSubmitting}
								compact
								loaderPosition="right"
								disabled={
									isSubmitting || itemsInCart.some(i => i.id === media.id)
								}
								// onClick={() => rentMedia(media.id)}
								onClick={() => addItemToCart(media)}
							>
								Add to cart
								<span className="sr-only">, {media.title}</span>
							</Button>
						)}
					</div>
				) : null}
			</td>
		</tr>
	)
}
