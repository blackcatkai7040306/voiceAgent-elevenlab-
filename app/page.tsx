import { TabNavigation } from "./components/TabNavigation"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-7xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
          ElevenLabs Conversational AI
        </h1>

        {/* Tab Navigation Component */}
        <TabNavigation />
      </div>
    </main>
  )
}
//webhook:
