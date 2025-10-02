import LeadTable from "@/components/LeadTable";

export default function Page() {
  return (
    <main className="max-w-5xl mx-auto">
      <header className="p-6">
        <h1 className="text-3xl font-bold">Marco DM and Engagement Hub</h1>
        <p className="opacity-70">Replies in your voice. Leads logged to Notion. Energy high.</p>
      </header>
      <LeadTable />
    </main>
  );
}
