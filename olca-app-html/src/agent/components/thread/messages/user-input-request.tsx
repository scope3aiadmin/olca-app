import React, { useState } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { useStreamContext } from "@/providers/Stream";
import { toast } from "sonner";
import { HelpCircle } from "lucide-react";

interface UserInputRequestProps {
  content: any;
  toolCallId?: string;
  toolName?: string;
}

export function UserInputRequest({ content, toolCallId, toolName }: UserInputRequestProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const stream = useStreamContext();
  const { question, options = [], context } = content;

  // Debug logging for user input request (only on mount)
  React.useEffect(() => {
    console.group(`❓ User Input Request: ${toolName || 'Unknown'}`);
    console.log('📋 Tool Call ID:', toolCallId);
    console.log('❓ Question:', question);
    console.log('🎯 Options:', options);
    console.log('📊 Context:', context);
    console.groupEnd();
  }, []); // Only run once on mount

  const handleSubmit = async () => {
    if (!selectedOption) {
      toast.error("Please select an option");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = {
        tool_response: {
          tool_name: toolName || "request_user_input",
          tool_call_id: toolCallId,
          user_input: {
            selected_option: selectedOption,
            additional_notes: additionalNotes.trim()
          }
        }
      };

      // Debug logging for response submission
      console.group(`📤 Submitting User Input Response: ${toolName || 'Unknown'}`);
      console.log('🎯 Selected Option:', selectedOption);
      console.log('📝 Additional Notes:', additionalNotes.trim());
      console.log('📋 Full Response:', response);
      console.log('🔗 Tool Call ID:', toolCallId);

      // Submit the response as a human message
      const humanMessage = {
        id: crypto.randomUUID(),
        type: "human" as const,
        content: [{ type: "text" as const, text: JSON.stringify(response) }]
      };

      console.log('📨 Human Message:', humanMessage);
      console.groupEnd();

      stream.submit(
        { messages: [humanMessage] },
        {
          streamMode: ["values"],
          streamSubgraphs: true,
          streamResumable: true,
        }
      );

      toast.success("Response submitted successfully");
    } catch (error) {
      console.error("❌ Error submitting user input response:", error);
      toast.error("Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-900">User Input Required</CardTitle>
        </div>
        <CardDescription className="text-blue-700">
          Please provide your input to continue the workflow
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Context Information */}
        {context && (
          <div className="bg-white p-3 rounded-lg border">
            <h4 className="font-semibold text-gray-900 mb-2">Context</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {Object.entries(context).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="font-medium capitalize">
                    {key.replace(/_/g, " ")}:
                  </span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-semibold text-gray-900 mb-3">{question}</h4>
          
          {/* Options */}
          <div className="space-y-3">
            {options.map((option: any, index: number) => (
              <div
                key={option.id || index}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedOption === option.id
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedOption(option.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === option.id
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}>
                    {selectedOption === option.id && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="additional-notes" className="text-sm font-medium">
            Additional Notes (Optional)
          </Label>
          <Textarea
            id="additional-notes"
            placeholder="Add any additional context or notes..."
            value={additionalNotes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdditionalNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedOption}
            className="min-w-[120px]"
          >
            {isSubmitting ? "Submitting..." : "Submit Response"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
