'use client';

import { useState, useEffect } from 'react';
import { Check, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface Step {
  number: number;
  description: string;
  toolToUse: string;
  expectedOutput: string;
}

interface StepPlannerWidgetProps {
  data: {
    goal: string;
    steps: Step[];
    totalSteps: number;
    status: string;
    currentStep?: number;
    completedSteps?: number[];
    requiresApproval?: boolean;
  };
}

export function StepPlannerWidget({ data }: StepPlannerWidgetProps) {
  // Use data from tool if available, otherwise use local state
  const completedStepsFromData = data.completedSteps || [];
  const currentStepFromData = data.currentStep || 0;

  const [completedSteps, setCompletedSteps] = useState<number[]>(completedStepsFromData);
  const [currentStep, setCurrentStep] = useState<number>(currentStepFromData);
  const [isExpanded, setIsExpanded] = useState(true);

  // Update state when data changes (real-time updates from AI)
  useEffect(() => {
    if (completedStepsFromData.length > 0) {
      setCompletedSteps(completedStepsFromData);
    }
    if (currentStepFromData > 0) {
      setCurrentStep(currentStepFromData);
    }
  }, [completedStepsFromData, currentStepFromData]);

  // Mark first step as current when plan is created
  useEffect(() => {
    if (data.steps.length > 0 && currentStep === 0) {
      setCurrentStep(1);
    }
  }, [data.steps, currentStep]);

  // Animate steps appearance
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExpanded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const getStepStatus = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) return 'completed';
    if (currentStep === stepNumber) return 'current';
    return 'pending';
  };

  const getStepIcon = (stepNumber: number) => {
    const status = getStepStatus(stepNumber);

    switch (status) {
      case 'completed':
        return (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 animate-in zoom-in duration-300">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        );
      case 'current':
        return (
          <div className="relative flex h-5 w-5 items-center justify-center">
            <div className="absolute h-5 w-5 rounded-full bg-blue-500 opacity-25 animate-ping" />
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" strokeWidth={2.5} />
          </div>
        );
      default:
        return (
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300">
            <div className="h-2 w-2 rounded-full bg-gray-300" />
          </div>
        );
    }
  };

  const getStepStyles = (stepNumber: number) => {
    const status = getStepStatus(stepNumber);

    switch (status) {
      case 'completed':
        return 'bg-green-50/50 border-green-200/60 shadow-sm';
      case 'current':
        return 'bg-blue-50/50 border-blue-200/60 shadow-md ring-2 ring-blue-100';
      default:
        return 'bg-card border-border/50';
    }
  };

  return (
    <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border border-border/50 rounded-lg cursor-pointer hover:border-border transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Update Todos</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{data.goal}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-muted-foreground">
            {completedSteps.length}/{data.totalSteps}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Progress Bar */}
          <div className="px-4 space-y-1.5">
            <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-primary/80 h-full transition-all duration-700 ease-out"
                style={{ width: `${(completedSteps.length / data.totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-1.5 px-2">
            {data.steps.map((step, index) => {
              const status = getStepStatus(step.number);

              return (
                <div
                  key={step.number}
                  className={`
                    group relative p-3 border rounded-lg transition-all duration-300 hover:shadow-sm
                    ${getStepStyles(step.number)}
                  `}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Connecting Line (except for last item) */}
                  {index < data.steps.length - 1 && (
                    <div className="absolute left-[18px] top-[32px] w-0.5 h-[calc(100%+6px)] bg-border/30" />
                  )}

                  <div className="flex items-start gap-3 relative">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-0.5 z-10 bg-background rounded-full">
                      {getStepIcon(step.number)}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`
                          text-sm font-medium transition-colors duration-200
                          ${status === 'completed' ? 'text-foreground/70 line-through' :
                            status === 'current' ? 'text-foreground font-semibold' :
                            'text-foreground/60'}
                        `}>
                          {step.description}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <code className={`
                          px-2 py-0.5 rounded font-mono transition-all duration-200
                          ${status === 'current' ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-muted/80 text-muted-foreground'}
                        `}>
                          {step.toolToUse}
                        </code>
                        {step.expectedOutput && (
                          <span className="text-muted-foreground/70">
                            • {step.expectedOutput}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step Number Badge */}
                    <div className="flex-shrink-0">
                      <div className={`
                        flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300
                        ${status === 'completed' ? 'bg-green-500 text-white shadow-sm' :
                          status === 'current' ? 'bg-blue-500 text-white shadow-md scale-110' :
                          'bg-muted/80 text-muted-foreground/60'}
                      `}>
                        {status === 'completed' ? '✓' : step.number}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Status */}
          <div className="px-4 pt-2">
            {data.requiresApproval && data.status === 'awaiting_approval' ? (
              <div className="flex items-center gap-2 text-xs text-amber-600 font-medium p-2 bg-amber-50 rounded-lg border border-amber-200">
                <Clock className="h-4 w-4" />
                Awaiting approval - Reply with "yes" or "proceed" to start execution
              </div>
            ) : completedSteps.length === data.totalSteps ? (
              <div className="flex items-center gap-2 text-xs text-green-600 font-medium animate-in fade-in duration-500">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                </div>
                All steps completed!
              </div>
            ) : currentStep > 0 ? (
              <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                Executing step {currentStep} of {data.totalSteps}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
