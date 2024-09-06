'use client'

import { init, tx, id } from '@instantdb/react'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import { Pencil, Trash2 } from 'lucide-react'

const APP_ID = 'e5efacba-93ff-4ecc-a50f-f6f03f4a0276'

type Question = {
    id: string
    email: string
    text: string
    createdAt: number
    creatorId: string
}

type Schema = {
    questions: Question
}

const db = init<Schema>({ appId: APP_ID })

export default function AuthenticatedApp() {
    const { isLoading, user, error } = db.useAuth()

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>
    }

    if (error) {
        return <div className="flex items-center justify-center h-screen">Uh oh! {error.message}</div>
    }

    if (user) {
        return <QuestionsApp user={user} />
    }

    return <Login />
}

function Login() {
    const [state, setState] = useState({
        sentEmail: '',
        email: '',
        error: null,
        code: '',
    })

    const { sentEmail, email, code, error } = state

    if (!sentEmail) {
        return (
            <form
                className="flex max-w-xs mx-auto flex-col gap-3 items-center h-screen px-2 pt-12"
                onSubmit={async (e) => {
                    e.preventDefault()

                    if (!email) return

                    setState({ ...state, sentEmail: email, error: null })

                    try {
                        await db.auth.sendMagicCode({ email })
                    } catch (error: any) {
                        setState({ ...state, error: error.body?.message })
                    }
                }}
            >
                <h2 className="text-lg font-bold">Let us log you in!</h2>
                <Input
                    placeholder="Enter your email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                        setState({ ...state, email: e.target.value, error: null })
                    }
                />
                <Button type="submit" className="w-full">
                    Send Code
                </Button>
                {error ? <p className="text-red-700 text-sm bg-red-50 border-red-500 border p-2">{error}</p> : null}
            </form>
        )
    }

    return (
        <form
            className="flex max-w-xs mx-auto flex-col gap-3 items-center h-screen px-2 pt-12"
            onSubmit={async (e) => {
                e.preventDefault()

                if (!code) return

                try {
                    await db.auth.signInWithMagicCode({ email: sentEmail, code })
                } catch (error: any) {
                    setState({ ...state, error: error.body?.message })
                }
            }}
        >
            <h2 className="text-lg font-bold">
                Okay we sent you an email! What was the code?
            </h2>
            <Input
                type="text"
                placeholder="Magic code"
                value={code || ''}
                onChange={(e) =>
                    setState({ ...state, code: e.target.value, error: null })
                }
            />
            <Button type="submit" className="w-full">Verify</Button>
            {error ? <p className="text-red-700 text-sm bg-red-50 border-red-500 border p-2">{error}</p> : null}
        </form>
    )
}

function QuestionsApp({ user }: { user: { email: string, id: string } }) {
    const { isLoading, error, data } = db.useQuery({ questions: {} })

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Fetching data...</div>
    }
    if (error) {
        return <div className="flex items-center justify-center h-screen">Error fetching data: {error.message}</div>
    }

    const { questions } = data
    const leaderboard = aggregateLeaderboard(questions)

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="container mx-auto max-w-5xl"
            >
                <h1 className="text-5xl font-bold text-center text-gray-800 mb-12">Questions for my Demo</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        <QuestionForm user={user} questions={questions} />
                        <QuestionList questions={questions} currentUserId={user.id} />
                    </div>
                    <div className="space-y-8">
                        <Leaderboard leaderboard={leaderboard} />
                        <ActionBar questions={questions} />
                    </div>
                </div>
                <footer className="text-center text-sm text-gray-500 mt-12">
                    Ask as many unique questions as you can!
                </footer>
            </motion.div>
        </div>
    )
}

function addQuestion(email: string, text: string, creatorId: string) {
    db.transact(
        tx.questions[id()].update({
            email,
            text,
            createdAt: Date.now(),
            creatorId,
        })
    )
}

function QuestionForm({ user, questions }: { user: { email: string, id: string }, questions: Question[] }) {
    return (
        <Card className="overflow-hidden shadow-sm border border-gray-200">
            <CardHeader className="bg-white border-b border-gray-100">
                <CardTitle className="text-gray-800">Ask a Question</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        const text = (e.target as HTMLFormElement).question.value
                        if (text) {
                            addQuestion(user.email, text, user.id);
                            (e.target as HTMLFormElement).question.value = ''
                        }
                    }}
                    className="space-y-4"
                >
                    <Input
                        name="email"
                        value={user.email}
                        readOnly
                        className="border-gray-300 bg-gray-100 cursor-not-allowed"
                    />
                    <Input name="question" placeholder="Ask a question..." className="border-gray-300 focus:border-blue-500 transition-colors duration-200" />
                    <Button type="submit" className="w-full text-white transition-colors duration-200">
                        Submit
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

function QuestionList({ questions, currentUserId }: { questions: Question[], currentUserId: string }) {
    return (
        <Card className="overflow-hidden shadow-sm border border-gray-200">
            <CardHeader className="bg-white border-b border-gray-100">
                <CardTitle className="text-gray-800">Questions Asked</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                    {questions.map((question, index) => (
                        <motion.div
                            key={question.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors duration-200"
                        >
                            <strong className="text-blue-600">{question.email}:</strong> {question.text}
                            {question.creatorId === currentUserId && (
                                <div className="mt-2 space-x-2">
                                    <Button
                                        onClick={() => updateQuestion(question.id, prompt('Update question:', question.text) || question.text)}
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Pencil className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button
                                        onClick={() => deleteQuestion(question.id)}
                                        size="sm"
                                        variant="destructive"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

function updateQuestion(questionId: string, newText: string) {
    db.transact(
        tx.questions[questionId].update({
            text: newText,
        })
    )
}

function deleteQuestion(questionId: string) {
    db.transact(
        tx.questions[questionId].delete()
    )
}

function Leaderboard({ leaderboard }: { leaderboard: { email: string, count: number }[] }) {
    return (
        <Card className="overflow-hidden shadow-sm border border-gray-200">
            <CardHeader className="bg-white border-b border-gray-100">
                <CardTitle className="text-gray-800">Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                    {leaderboard.map((entry, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors duration-200"
                        >
                            <span className="font-semibold text-blue-500">{index + 1}.</span> {entry.email} - {entry.count} question{entry.count !== 1 ? 's' : ''}
                        </motion.div>
                    ))}
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

function ActionBar({ questions }: { questions: Question[] }) {
    return (
        <Card className="overflow-hidden shadow-sm border border-gray-200">
            <CardContent className="p-6 bg-white">
                <div className="text-2xl font-bold text-gray-800">Total questions: {questions.length}</div>
            </CardContent>
        </Card>
    )
}

function aggregateLeaderboard(questions: Question[]) {
    const leaderboardMap: { [key: string]: number } = {}
    questions.forEach((question) => {
        leaderboardMap[question.email] = (leaderboardMap[question.email] || 0) + 1
    })
    return Object.entries(leaderboardMap)
        .map(([email, count]) => ({ email, count }))
        .sort((a, b) => b.count - a.count)
}