import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WordPairsBuilderManage } from '@/components/word-pairs-builder-manage'
import { WordPairsBuilderPractice } from '@/components/word-pairs-builder-practice'

export default function WordPairsBuilderPage() {
  return (
    <div className="container mx-auto max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Word Pairs</h1>
        <p className="text-muted-foreground">
          Manage word pairs, generate examples and synonyms
        </p>
      </div>
      <Tabs defaultValue="practice" className="space-y-6">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>
        <TabsContent value="practice" className="mt-6">
          <WordPairsBuilderPractice />
        </TabsContent>
        <TabsContent value="manage" className="mt-6">
          <WordPairsBuilderManage />
        </TabsContent>
      </Tabs>
    </div>
  )
}
