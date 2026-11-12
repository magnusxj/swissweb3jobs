import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function EmployerDashboard() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 pb-20 pt-10">
        <div className="mx-auto w-full max-w-5xl px-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#231b42] text-sm font-bold text-white">SY</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Employer Dashboard</h1>
              <p className="text-sm text-slate-500">Sygnum Bank AG (Demo)</p>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Active listings</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">2</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Views</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">1,420</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Apply clicks</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">84</p>
            </div>
          </div>

          <h2 className="mt-10 text-lg font-bold text-slate-900">Live listings</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Title</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">Senior Web3 Engineer</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Active</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-500">52</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">Compliance Officer Digital Assets</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Active</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-500">32</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
