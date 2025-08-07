import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HelpCircle, Trash2 } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order_index: number;
}

interface ClubFAQsProps {
  faqs: FAQ[];
  newFAQ: { question: string; answer: string };
  isOwner: boolean;
  onNewFAQChange: (field: 'question' | 'answer', value: string) => void;
  onCreateFAQ: (e: React.FormEvent) => void;
  onDeleteFAQ: (faqId: string) => void;
}

const ClubFAQs: React.FC<ClubFAQsProps> = ({
  faqs,
  newFAQ,
  isOwner,
  onNewFAQChange,
  onCreateFAQ,
  onDeleteFAQ
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Club FAQs ({faqs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Create FAQ form (only for owner) */}
          {isOwner && (
            <form onSubmit={onCreateFAQ} className="space-y-4 mb-6">
              <div>
                <Label htmlFor="faq-question">Question</Label>
                <Input
                  id="faq-question"
                  value={newFAQ.question}
                  onChange={(e) => onNewFAQChange('question', e.target.value)}
                  placeholder="Enter question..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="faq-answer">Answer</Label>
                <Textarea
                  id="faq-answer"
                  value={newFAQ.answer}
                  onChange={(e) => onNewFAQChange('answer', e.target.value)}
                  placeholder="Enter answer..."
                  rows={3}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Add FAQ
              </Button>
            </form>
          )}

          {/* FAQs list */}
          <div className="space-y-4">
            {faqs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No FAQs added yet.</p>
              </div>
            ) : (
              faqs.map((faq) => (
                <Card key={faq.id} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{faq.question}</CardTitle>
                      {isOwner && (
                        <Button
                          onClick={() => onDeleteFAQ(faq.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubFAQs;