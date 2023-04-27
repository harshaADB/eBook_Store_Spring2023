import {Disclosure, Menu, Transition} from '@headlessui/react'
import {Bars3Icon, XMarkIcon} from '@heroicons/react/24/outline'
import {Anchor, Divider} from '@mantine/core'
import {PaymentStatus, Role} from '@prisma/client'
import type {LoaderArgs, SerializeFrom} from '@remix-run/node'
import {json} from '@remix-run/node'
import {
	Form,
	Link,
	NavLink,
	Outlet,
	useLoaderData,
	useLocation,
} from '@remix-run/react'
import * as React from 'react'
import siteConfig from 'site.config'
import {getAllMedia} from '~/lib/media.server'
import {getPaymentsByUserId} from '~/lib/payment.server'
import {getUser, requireUser} from '~/lib/session.server'
import {getAllTransaction} from '~/lib/transaction.server'
import {useOptionalUser} from '~/utils/hooks'
import {cx} from '~/utils/string'

export type DashboardLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	const user = await requireUser(request)

	const allMedia = await getAllMedia()
	const allTransaction = await getAllTransaction(user.id)

	const rentedMedia = allTransaction.filter(
		transaction => !transaction.returnedAt
	)
	const returnedMedia = allTransaction.filter(transaction =>
		Boolean(transaction.returnedAt)
	)
	const previousPayments = await getPaymentsByUserId(user.id)
	const totalAmount = returnedMedia.reduce((total, transaction) => {
		const payment = transaction.amount ?? 0
		return total + payment
	}, 0)

	const totalAmountDue = returnedMedia.reduce((total, transaction) => {
		const isDue = transaction.paymentStatus === PaymentStatus.UNPAID
		const amountDue = isDue ? transaction.amount - transaction.paid : 0
		return total + amountDue
	}, 0)

	return json({
		user,
		allMedia,
		rentedMedia,
		returnedMedia,
		previousPayments,
		totalAmountDue,
		totalAmount,
		isAdmin: user.role === Role.ADMIN,
	})
}

export default function DashboardLayout() {
	const location = useLocation()
	const {user} = useOptionalUser()
	const {isAdmin} = useLoaderData<typeof loader>()

	return (
		<>
			<Disclosure as="header" className="bg-white shadow">
				{({open}) => (
					<>
						<div className="max-w-7xl mx-auto px-2 sm:px-4 lg:divide-y lg:divide-gray-200 lg:px-8">
							<div className="relative h-16 flex justify-between">
								<div className="relative z-10 px-2 flex lg:px-0">
									<div className="flex-shrink-0 flex items-center">
										<img
											className="block h-8 w-auto"
											src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
											alt="Workflow"
										/>
									</div>
								</div>

								<div className="relative z-10 flex items-center lg:hidden">
									{/* Mobile menu button */}
									<Disclosure.Button className="rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
										<span className="sr-only">Open menu</span>
										{open ? (
											<XMarkIcon className="block h-6 w-6" aria-hidden="true" />
										) : (
											<Bars3Icon className="block h-6 w-6" aria-hidden="true" />
										)}
									</Disclosure.Button>
								</div>

								<div className="hidden lg:relative lg:z-10 lg:ml-4 lg:flex lg:items-center">
									{/* Profile dropdown */}
									{user ? (
										<Menu as="div" className="flex-shrink-0 relative ml-4">
											<div>
												<Menu.Button className="bg-white rounded-full flex focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
													<span className="sr-only">Open user menu</span>
													<div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 text-sm font-medium">
														{user.name.charAt(0)}
													</div>
												</Menu.Button>
											</div>
											<Transition
												as={React.Fragment}
												enter="transition ease-out duration-100"
												enterFrom="transform opacity-0 scale-95"
												enterTo="transform opacity-100 scale-100"
												leave="transition ease-in duration-75"
												leaveFrom="transform opacity-100 scale-100"
												leaveTo="transform opacity-0 scale-95"
											>
												<Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 focus:outline-none">
													<Menu.Item>
														{({active}) => (
															<Form
																replace
																action="/auth/logout"
																method="post"
																className={cx(active ? 'bg-gray-100' : '')}
															>
																<button
																	type="submit"
																	className="block w-full px-4 py-2 text-left text-sm text-gray-700"
																>
																	Logout
																</button>
															</Form>
														)}
													</Menu.Item>
												</Menu.Items>
											</Transition>
										</Menu>
									) : (
										<div className="flex items-center gap-2">
											<Anchor
												component={Link}
												to={`/login?redirectTo=${location.pathname}`}
												prefetch="intent"
												variant="gradient"
												size="sm"
											>
												Sign in
											</Anchor>

											<Divider
												orientation="vertical"
												className="!h-6 !my-auto"
											/>

											<Anchor
												component={Link}
												to="/register"
												prefetch="intent"
												variant="gradient"
												size="sm"
											>
												Create account
											</Anchor>
										</div>
									)}
								</div>
							</div>

							<nav
								className="hidden lg:py-2 lg:flex lg:space-x-8"
								aria-label="Global"
							>
								{isAdmin ? (
									siteConfig.adminLinks.map(link => (
										<NavLink
											key={link.name}
											to={link.href}
											prefetch="intent"
											end={link.href === '/admin'}
											className={({isActive}) =>
												cx(
													isActive
														? 'bg-gray-100 text-gray-900'
														: 'text-gray-900 hover:bg-gray-50 hover:text-gray-900',
													'rounded-md py-2 px-3 inline-flex items-center text-sm font-medium'
												)
											}
										>
											{link.name}
										</NavLink>
									))
								) : (
									<>
										{siteConfig.publicLinks.map(link => (
											<NavLink
												key={link.name}
												to={link.href}
												prefetch="intent"
												end={link.href === '/'}
												className={({isActive}) =>
													cx(
														isActive
															? 'bg-gray-100 text-gray-900'
															: 'text-gray-900 hover:bg-gray-50 hover:text-gray-900',
														'rounded-md py-2 px-3 inline-flex items-center text-sm font-medium'
													)
												}
											>
												{link.name}
											</NavLink>
										))}

										{user &&
											siteConfig.navigationLinks.map(link => (
												<NavLink
													key={link.name}
													to={link.href}
													prefetch="intent"
													end={link.href === '/'}
													className={({isActive}) =>
														cx(
															isActive
																? 'bg-gray-100 text-gray-900'
																: 'text-gray-900 hover:bg-gray-50 hover:text-gray-900',
															'rounded-md py-2 px-3 inline-flex items-center text-sm font-medium'
														)
													}
												>
													{link.name}
												</NavLink>
											))}
									</>
								)}
							</nav>
						</div>
					</>
				)}
			</Disclosure>

			<main className="min-h-full">
				<div className="max-w-7xl mx-auto">
					<Outlet />
				</div>
			</main>
		</>
	)
}
