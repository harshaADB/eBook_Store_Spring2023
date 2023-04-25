import {ReceiptRefundIcon} from '@heroicons/react/24/outline'
import {CheckIcon} from '@heroicons/react/24/solid'
import {Role} from '@prisma/client'
import type {LoaderArgs} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import {requireUser} from '~/lib/session.server'
import {useDashboardData} from '~/utils/hooks'
import {formatCurrency} from '~/utils/misc'

export const loader = async ({request}: LoaderArgs) => {
	const user = await requireUser(request)

	if (user.role === Role.ADMIN) {
		return redirect('/admin')
	}

	return json(null)
}

export default function Library() {
	const {previousPayments} = useDashboardData()

	return (
		<>
			<div className="px-4 sm:px-6 lg:px-8 mt-8">
				<div className="sm:flex-auto">
					<h1 className="text-xl font-semibold text-gray-900">
						Payment History
					</h1>
					<p className="mt-2 text-sm text-gray-700">
						A list of all the previous payment made.
					</p>
				</div>

				<div className="mt-8 flex flex-col">
					<div className="bg-white shadow-md border border-gray-200 overflow-hidden sm:rounded-md">
						{previousPayments.length > 0 ? (
							<ul className="divide-y divide-gray-200">
								{previousPayments.map(previousPayment => (
									<li key={previousPayment.id}>
										<div className="flex items-center px-4 py-4 sm:px-6">
											<div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
												<div className="hidden md:block">
													<div>
														<p className="text-sm text-gray-900">
															<span>Total amount -</span>
															<span className="font-semibold ml-1">
																{formatCurrency(previousPayment.amount)}
															</span>
														</p>

														<p className="mt-2 flex items-center text-sm text-gray-500">
															<span>Payment date -</span>
															<span className="font-semibold ml-1">
																{new Date(
																	previousPayment.createdAt!
																).toLocaleDateString('en-US')}{' '}
															</span>
															<span className="ml-1">
																({previousPayment.method.replace('_', ' ')})
															</span>
														</p>
													</div>
												</div>
											</div>

											<div>
												<CheckIcon
													className="flex-shrink-0 h-9 w-9 text-green-600"
													aria-hidden="true"
												/>
											</div>
										</div>
									</li>
								))}
							</ul>
						) : (
							<div className="flex items-center px-4 py-4 sm:px-6 justify-center ">
								<div className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg px-12 py-8 text-center sm:col-span-2 xl:col-span-4">
									<ReceiptRefundIcon className="mx-auto h-12 w-12 text-gray-400" />
									<h3 className="mt-2 text-sm font-medium text-gray-900">
										No previous payments
									</h3>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	)
}
