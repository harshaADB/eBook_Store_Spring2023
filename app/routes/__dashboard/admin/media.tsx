import {PlusIcon} from '@heroicons/react/24/solid'
import {
	Button,
	clsx,
	Modal,
	MultiSelect,
	Select,
	Textarea,
	TextInput,
} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import type {Media} from '@prisma/client'
import {MediaType} from '@prisma/client'
import type {ActionFunction} from '@remix-run/node'
import {json} from '@remix-run/node'
import {useFetcher} from '@remix-run/react'
import {ObjectId} from 'bson'
import * as React from 'react'
import {db} from '~/lib/prisma.server'
import {ManageMediaSchema} from '~/lib/zod.schema'
import {useDashboardData} from '~/utils/hooks'
import {badRequest} from '~/utils/misc.server'
import {formatList, titleCase} from '~/utils/string'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'

enum MODE {
	edit,
	add,
}

interface ActionData {
	success: boolean
	fieldErrors?: inferErrors<typeof ManageMediaSchema>
}

export const action: ActionFunction = async ({request}) => {
	const {fields, fieldErrors} = await validateAction(request, ManageMediaSchema)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	const {mediaId, ...rest} = fields
	const id = new ObjectId()

	await db.media.upsert({
		where: {
			id: mediaId || id.toString(),
		},
		update: {...rest},
		create: {...rest},
	})

	return json({
		success: true,
	})
}

export default function ManageMedia() {
	const fetcher = useFetcher<ActionData>()
	const {allMedia} = useDashboardData()

	const [media, setMedia] = React.useState<Media | null>(null)
	const [mode, setMode] = React.useState<MODE>(MODE.edit)
	const [isModalOpen, {open: openModal, close: closeModal}] =
		useDisclosure(false)

	const isSubmitting = fetcher.state !== 'idle'

	React.useEffect(() => {
		if (fetcher.state === 'idle') {
			return
		}

		if (fetcher.data?.success) {
			setMedia(null)
			closeModal()
		}
	}, [closeModal, fetcher.data?.success, fetcher.state])

	return (
		<>
			<div className="px-4 sm:px-6 lg:px-8 mt-8">
				<div className="sm:flex-auto sm:flex sm:items-center sm:justify-between">
					<div>
						<h1 className="text-xl font-semibold text-gray-900">
							Manage Media
						</h1>
						<p className="mt-2 text-sm text-gray-700">
							A list of all the media currently present in library.
						</p>
					</div>

					<div>
						<Button
							loading={isSubmitting}
							loaderPosition="left"
							onClick={() => {
								setMode(MODE.add)
								openModal()
							}}
						>
							<PlusIcon className="h-4 w-4" />
							<span className="ml-2">Add media</span>
						</Button>
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
											className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900"
										>
											Type
										</th>
										<th
											scope="col"
											className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900"
										>
											Rent / day
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
									{allMedia.map(media => (
										<tr key={media.id}>
											<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
												{media.title}
											</td>
											<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
												{media.type}
											</td>
											<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
												${media.rentPerDay.toFixed(2)}
											</td>
											<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500 hidden sm:table-cell">
												{formatList(media.category)}
											</td>
											<td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 md:pr-0 space-x-4">
												<div className="flex gap-6 items-center">
													<Button
														loading={isSubmitting}
														variant="subtle"
														loaderPosition="right"
														onClick={() => {
															setMedia(media)
															setMode(MODE.edit)
															openModal()
														}}
													>
														Edit
														<span className="sr-only">, {media.title}</span>
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			<Modal
				opened={isModalOpen}
				onClose={() => {
					setMedia(null)
					closeModal()
				}}
				title={clsx({
					'Edit media': mode === MODE.edit,
					'Add media': mode === MODE.add,
				})}
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<input type="hidden" name="mediaId" value={media?.id} />

						<TextInput
							name="title"
							label="Title"
							defaultValue={media?.title}
							error={fetcher.data?.fieldErrors?.title}
							required
						/>

						<Textarea
							name="description"
							label="Description"
							defaultValue={media?.description}
							error={fetcher.data?.fieldErrors?.description}
							required
						/>

						<Select
							name="type"
							label="Media type"
							placeholder="Pick one"
							data={Object.keys(MediaType).map(key => ({
								value: key,
								label: titleCase(key),
							}))}
							defaultValue={media?.type}
						/>

						<TextInput
							name="link"
							label="Link"
							defaultValue={media?.link}
							error={fetcher.data?.fieldErrors?.link}
							required
						/>

						<TextInput
							name="rentPerDay"
							label="Rent per day"
							defaultValue={media?.rentPerDay}
							error={fetcher.data?.fieldErrors?.rentPerDay}
							required
						/>

						<MultiSelect
							name="category"
							label="Category"
							required
							data={[
								'Music',
								'Action',
								'Sci-Fi',
								'Documentary',
								'Rock',
								'Fantasy',
								'Adventure',
								'Contemporary',
								'Dystopian',
								'Mystery',
								'Horror',
								'Thriller',
								'Paranormal',
								'Historical fiction',
								'Science Fiction',
								'Childrens',
							]}
							defaultValue={media?.category}
							placeholder="Select categories"
							searchable
							error={fetcher.data?.fieldErrors?.category}
						/>

						<div className="flex items-center justify-end gap-4 mt-1">
							<Button
								variant="subtle"
								disabled={isSubmitting}
								onClick={() => {
									setMedia(null)
									closeModal()
								}}
								color="red"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={isSubmitting}
								loaderPosition="right"
							>
								Register
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</Modal>
		</>
	)
}
