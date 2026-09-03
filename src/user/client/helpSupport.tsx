import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { HelpCircle, MessageCircle, Phone, Mail, FileText, Search, Send, MapPin } from "lucide-react"

export function HelpSupport() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [supportForm, setSupportForm] = useState({
    subject: "",
    category: "",
    priority: "",
    message: "",
  })

  if (!user) return null

  const faqs = [
    {
      question: "How long does loan approval take?",
      answer:
        "Loan approval typically takes 2-5 business days after all required documents are submitted and verified. We'll notify you via SMS and email once a decision is made.",
    },
    {
      question: "What documents do I need for a loan application?",
      answer:
        "Required documents include: National ID/Passport, recent payslips (3 months), bank statements (6 months), proof of residence, and KRA PIN certificate. Additional documents may be required based on loan type.",
    },
    {
      question: "Can I make early loan repayments?",
      answer:
        "Yes, you can make early repayments without penalty. Early payments will reduce your outstanding balance and may reduce the total interest paid over the loan term.",
    },
    {
      question: "How do I update my personal information?",
      answer:
        "You can update your personal information by going to the 'Personal Information' section in your dashboard. Some changes may require document verification.",
    },
    {
      question: "What happens if I miss a payment?",
      answer:
        "If you miss a payment, a late fee of 5% will be applied to the overdue amount. We recommend contacting us immediately if you're experiencing payment difficulties.",
    },
    {
      question: "How can I check my loan balance?",
      answer:
        "Your current loan balance is always visible on your dashboard. You can also view detailed statements in the 'Statements' section.",
    },
    {
      question: "Can I apply for multiple loans?",
      answer:
        "You can apply for a new loan once your current loan repayment history shows good standing. Each application is assessed individually.",
    },
    {
      question: "How do I download my loan statements?",
      answer:
        "Go to the 'Statements' section, select your desired period and loan, then click 'Download PDF' to get your statement.",
    },
  ]

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const supportTickets = [
    {
      id: "TKT-001",
      subject: "Unable to upload documents",
      category: "Technical",
      status: "open",
      priority: "medium",
      createdAt: "2024-01-20T10:00:00Z",
      lastUpdate: "2024-01-20T14:30:00Z",
    },
    {
      id: "TKT-002",
      subject: "Question about interest rates",
      category: "General",
      status: "resolved",
      priority: "low",
      createdAt: "2024-01-18T09:15:00Z",
      lastUpdate: "2024-01-19T11:20:00Z",
    },
  ]

  const handleSupportSubmit = () => {
    console.log("Submitting support request:", supportForm)
    // Here you would submit to backend
    setSupportForm({ subject: "", category: "", priority: "", message: "" })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "destructive"
      case "in_progress":
        return "secondary"
      case "resolved":
        return "default"
      default:
        return "outline"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Help & Support</h1>
        <p className="text-muted-foreground">Get help with your loan account and find answers to common questions</p>
      </div>

      {/* Quick Contact */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Call Us</h3>
                <p className="text-sm text-muted-foreground">+254 700 175 228</p>
                <p className="text-xs text-muted-foreground">Mon-Fri, 8AM-6PM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Email Us</h3>
                <p className="text-sm text-muted-foreground">info@techriseglow.co.ke</p>
                <p className="text-xs text-muted-foreground">Response within 24hrs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Visit Us</h3>
                <p className="text-sm text-muted-foreground">Nairobi, Kenya</p>
                <p className="text-xs text-muted-foreground">By appointment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="faq" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
          <TabsTrigger value="tickets">My Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>Find quick answers to common questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* FAQ Accordion */}
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {filteredFaqs.length === 0 && (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No FAQs Found</h3>
                  <p className="text-muted-foreground">Try adjusting your search terms or contact support directly.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Contact Support
              </CardTitle>
              <CardDescription>Send us a message and we'll get back to you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    value={supportForm.subject}
                    onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={supportForm.category}
                    onValueChange={(value) => setSupportForm({ ...supportForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="account">Account Management</SelectItem>
                      <SelectItem value="loan">Loan Related</SelectItem>
                      <SelectItem value="payment">Payment Issue</SelectItem>
                      <SelectItem value="documents">Document Upload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={supportForm.priority}
                  onValueChange={(value) => setSupportForm({ ...supportForm, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - General question</SelectItem>
                    <SelectItem value="medium">Medium - Need assistance</SelectItem>
                    <SelectItem value="high">High - Urgent issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Please describe your issue in detail..."
                  rows={6}
                  value={supportForm.message}
                  onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                />
              </div>

              <Button onClick={handleSupportSubmit} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Support Tickets
              </CardTitle>
              <CardDescription>Track your support requests and responses</CardDescription>
            </CardHeader>
            <CardContent>
              {supportTickets.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Support Tickets</h3>
                  <p className="text-muted-foreground">You haven't submitted any support requests yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{ticket.subject}</h4>
                          <p className="text-sm text-muted-foreground">Ticket #{ticket.id}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(ticket.priority)}>{ticket.priority.toUpperCase()}</Badge>
                          <Badge variant={getStatusColor(ticket.status)}>
                            {ticket.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid gap-2 md:grid-cols-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Category:</span>
                          <span className="ml-2 font-medium">{ticket.category}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <span className="ml-2 font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Update:</span>
                          <span className="ml-2 font-medium">{new Date(ticket.lastUpdate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {ticket.status === "open" && (
                          <Button variant="outline" size="sm">
                            Add Response
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>Helpful links and information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Quick Links</h4>
              <div className="space-y-1 text-sm">
                <a href="#" className="block text-primary hover:underline">
                  Loan Application Guide
                </a>
                <a href="#" className="block text-primary hover:underline">
                  Document Requirements
                </a>
                <a href="#" className="block text-primary hover:underline">
                  Repayment Schedule Calculator
                </a>
                <a href="#" className="block text-primary hover:underline">
                  Terms and Conditions
                </a>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Business Hours</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                <p>Saturday: 9:00 AM - 1:00 PM</p>
                <p>Sunday: Closed</p>
                <p>Public Holidays: Closed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
