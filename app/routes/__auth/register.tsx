import {Anchor, Button, PasswordInput, TextInput} from '@mantine/core'
import {Role} from '@prisma/client'
import type {ActionFunction} from '@remix-run/node'
import {Link, useFetcher} from '@remix-run/react'
import {createUserSession} from '~/lib/session.server'
import {createUser, getUserByEmail} from '~/lib/user.server'
import {RegisterUserSchema} from '~/lib/zod.schema'
import {badRequest} from '~/utils/misc.server'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'

interface ActionData {
	fieldErrors?: inferErrors<typeof RegisterUserSchema>
}

export const action: ActionFunction = async ({request}) => {
	const {fields, fieldErrors} = await validateAction(
		request,
		RegisterUserSchema
	)

	if (fieldErrors) {
		return badRequest<ActionData>({fieldErrors})
	}

	const {email, name, password} = fields

	const existingUser = await getUserByEmail(email)
	if (existingUser) {
		return badRequest<ActionData>({
			fieldErrors: {email: 'A user already exists with this email'},
		})
	}

	const user = await createUser({
		email,
		password,
		name,
	})

	return createUserSession({
		request,
		role: Role.USER,
		userId: user.id,
		redirectTo: '/',
	})
}

export default function Register() {
	const fetcher = useFetcher<ActionData>()
	const actionData = fetcher.data

	const isSubmitting = fetcher.state !== 'idle'

	return (
		<>
			<div>
				<h2 className="mt-6 text-3xl font-extrabold text-gray-900">Register</h2>
			</div>

			<fetcher.Form replace method="post" className="mt-8">
				<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
					<TextInput
						name="name"
						autoComplete="given-name"
						label="Name"
						error={actionData?.fieldErrors?.name}
						required
					/>

					<TextInput
						name="email"
						type="email"
						autoComplete="email"
						label="Email address"
						error={actionData?.fieldErrors?.email}
						required
					/>

					<PasswordInput
						name="password"
						label="Password"
						error={actionData?.fieldErrors?.password}
						autoComplete="current-password"
						required
					/>

					<PasswordInput
						name="confirmPassword"
						label="Confirm password"
						error={actionData?.fieldErrors?.password}
						autoComplete="current-password"
						required
					/>

					<div className="flex items-center justify-between gap-4 mt-1">
						<Anchor component={Link} to="/login" size="sm" prefetch="intent">
							Have an account already? Sign in
						</Anchor>

						<Button type="submit" loading={isSubmitting} loaderPosition="right">
							Register
						</Button>
					</div>
				</fieldset>
			</fetcher.Form>
		</>
	)
}
