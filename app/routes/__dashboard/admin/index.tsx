import {ArrowRightIcon} from '@heroicons/react/24/solid'
import {Badge} from '@mantine/core'
import {useAdminData} from '~/utils/hooks'

export default function AdminIndex() {
	const {nonAdminUsers} = useAdminData()

	return (
		<>
			<div className="flex flex-col gap-12">
				<div className="px-4 mt-6 sm:px-6 lg:px-8">
					<h2 className="text-gray-500 text-xs font-medium uppercase tracking-wide">
						Users
					</h2>

					<div className="mt-3">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{nonAdminUsers.map(user => (
								<div
									key={user.id}
									className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3"
								>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-900">
											{user.name}
										</p>

										<p className="text-sm text-gray-500 truncate">
											{user.email}
										</p>

										<ul className="mt-6 ml-2 text-sm text-gray-600">
											{user.transactions.map(transaction => (
												<li
													key={transaction.id}
													className="flex items-center gap-4"
												>
													<ArrowRightIcon className="h-4 w-4" />
													<span>
														{transaction.media.title} ({transaction.media.type})
													</span>

													<div className="flex items-center gap-2">
														{transaction.returnedAt ? (
															<Badge color="blue">Returned</Badge>
														) : (
															<Badge color="red">Borrowed</Badge>
														)}
													</div>
												</li>
											))}
										</ul>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
