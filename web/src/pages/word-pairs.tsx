import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WordPairsManage } from '@/components/word-pairs-manage'
import { WordPairsLearn } from '@/components/word-pairs-learn'

export default function WordPairsPage() {
  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="learn">Learn</TabsTrigger>
        </TabsList>
        <TabsContent value="manage">
          <WordPairsManage />
        </TabsContent>
        <TabsContent value="learn">
          <WordPairsLearn />
        </TabsContent>
      </Tabs>
    </div>
  )
}
