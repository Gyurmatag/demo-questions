'use client'

import { init, tx, id } from '@instantdb/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"

const APP_ID = 'e5efacba-93ff-4ecc-a50f-f6f03f4a0276'

type Schema = {
    questions: Question
}

const db = init<Schema>({ appId: APP_ID })

export default function Component() {
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
                        <QuestionForm questions={questions} />
                        <QuestionList questions={questions} />
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

function addQuestion(name: string, text: string) {
    db.transact(
        tx.questions[id()].update({
            name,
            text,
            createdAt: Date.now(),
        })
    )
}

function QuestionForm({ questions }: { questions: Question[] }) {
    return (
        <Card className="overflow-hidden shadow-sm border border-gray-200">
            <CardHeader className="bg-white border-b border-gray-100">
                <CardTitle className="text-gray-800">Ask a Question</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        const name = (e.target as HTMLFormElement).username.value
                        const text = (e.target as HTMLFormElement).question.value
                        if (name && text) {
                            addQuestion(name, text)
                            ;(e.target as HTMLFormElement).question.value = ''
                        }
                    }}
                    className="space-y-4"
                >
                    <Input name="username" placeholder="Your Name" autoFocus className="border-gray-300 focus:border-blue-500 transition-colors duration-200" />
                    <Input name="question" placeholder="Ask a question..." className="border-gray-300 focus:border-blue-500 transition-colors duration-200" />
                    <Button type="submit" className="w-full text-white transition-colors duration-200">
                        Submit
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

function QuestionList({ questions }: { questions: Question[] }) {
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
                            <strong className="text-blue-600">{question.name}:</strong> {question.text}
                        </motion.div>
                    ))}
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

function Leaderboard({ leaderboard }: { leaderboard: { name: string, count: number }[] }) {
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
                            <span className="font-semibold text-blue-500">{index + 1}.</span> {entry.name} - {entry.count} question{entry.count !== 1 ? 's' : ''}
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
        leaderboardMap[question.name] = (leaderboardMap[question.name] || 0) + 1
    })
    return Object.entries(leaderboardMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
}

type Question = {
    id: string
    name: string
    text: string
    createdAt: number
}