import { useFormContext, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, UserPlus, AlertCircle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AgentDetails() {
  const { register, formState: { errors }, control } = useFormContext();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "agents",
  });

  const addAgent = () => {
    append({
      agent_name: "",
      agent_phone: "",
      agent_id_number: "",
      agent_email: "",
    });
  };

  // Safe error getter
  const getFieldError = (index: number, fieldName: string) => {
    try {
      const agentErrors = errors?.agents as any;
      return agentErrors?.[index]?.[fieldName]?.message;
    } catch {
      return undefined;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Users className="h-5 w-5" />
              Agent Information
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Add agent details (optional)
            </CardDescription>
          </div>
          {fields.length > 0 && (
            <Badge variant="secondary" className="text-xs w-fit">
              {fields.length} {fields.length === 1 ? "Agent" : "Agents"}
            </Badge>
          )}
        </div>

        <Alert variant="default" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm">
            Agents are optional. All agent fields are required if you choose to add an agent.
          </AlertDescription>
        </Alert>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6">
        {/* Empty State */}
        {fields.length === 0 && (
          <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-lg">
            <UserPlus className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">No Agents Added</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 px-4">
              Click below to add an agent for this member
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={addAgent}
              className="w-full sm:w-auto mx-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </div>
        )}

        {/* Agent Cards */}
        {fields.map((field, index) => {
          const nameError = getFieldError(index, "agent_name");
          const phoneError = getFieldError(index, "agent_phone");
          const idError = getFieldError(index, "agent_id_number");
          const emailError = getFieldError(index, "agent_email");

          return (
            <Card key={field.id} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <CardTitle className="text-base sm:text-lg">
                      Agent {index + 1}
                    </CardTitle>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">Remove</span>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4">
                {/* Agent Name */}
                <div className="space-y-1.5">
                  <Label htmlFor={`agents.${index}.agent_name`} className="text-sm">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`agents.${index}.agent_name`}
                    {...register(`agents.${index}.agent_name`, {
                      required: "Agent name is required",
                      minLength: {
                        value: 2,
                        message: "Name must be at least 2 characters"
                      }
                    })}
                    placeholder="Enter agent's full name"
                    className="text-sm"
                  />
                  {nameError && (
                    <p className="text-xs text-destructive flex items-start gap-1">
                      <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      {nameError}
                    </p>
                  )}
                </div>

                {/* Grid for Phone and ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Agent Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`agents.${index}.agent_phone`} className="text-sm">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`agents.${index}.agent_phone`}
                      {...register(`agents.${index}.agent_phone`, {
                        required: "Phone number is required",
                        pattern: {
                          value: /^(07|01)\d{8}$/,
                          message: "Invalid format (07XXXXXXXX)"
                        }
                      })}
                      placeholder="0712345678"
                      className="text-sm"
                    />
                    {phoneError && (
                      <p className="text-xs text-destructive flex items-start gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        {phoneError}
                      </p>
                    )}
                  </div>

                  {/* Agent ID Number */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`agents.${index}.agent_id_number`} className="text-sm">
                      ID Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`agents.${index}.agent_id_number`}
                      {...register(`agents.${index}.agent_id_number`, {
                        required: "ID number is required",
                        minLength: {
                          value: 6,
                          message: "ID must be at least 6 characters"
                        },
                        maxLength: {
                          value: 10,
                          message: "ID must not exceed 10 characters"
                        }
                      })}
                      placeholder="876543"
                      className="text-sm"
                    />
                    {idError && (
                      <p className="text-xs text-destructive flex items-start gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        {idError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Agent Email */}
                <div className="space-y-1.5">
                  <Label htmlFor={`agents.${index}.agent_email`} className="text-sm">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={`agents.${index}.agent_email`}
                    type="email"
                    {...register(`agents.${index}.agent_email`, {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    })}
                    placeholder="agent@example.com"
                    className="text-sm"
                  />
                  {emailError && (
                    <p className="text-xs text-destructive flex items-start gap-1">
                      <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      {emailError}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Add Another Agent Button */}
        {fields.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={addAgent}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Agent
          </Button>
        )}
      </CardContent>
    </Card>
  );
}