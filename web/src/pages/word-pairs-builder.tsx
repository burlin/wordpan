import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WordPairsBuilderManage } from '@/components/word-pairs-builder-manage'
import { WordPairsBuilderPractice } from '@/components/word-pairs-builder-practice'

export default function WordPairsBuilderPage() {
  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
        </TabsList>
        <TabsContent value="manage">
          <WordPairsBuilderManage />
        </TabsContent>
        <TabsContent value="practice">
          <WordPairsBuilderPractice />
        </TabsContent>
      </Tabs>
    </div>
  )
}
