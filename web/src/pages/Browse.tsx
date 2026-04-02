import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBusinesses, deleteBusiness, type Business } from "@/lib/supabase";
import { toast } from "sonner";
import { Search, Download, Trash2, Filter, MapPin } from "lucide-react";

export function Browse() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(0);
  const limit = 50;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["businesses", search, category, city, page],
    queryFn: () =>
      getBusinesses({
        search: search || undefined,
        category: category || undefined,
        city: city || undefined,
        limit,
        offset: page * limit,
      }),
  });

  const businesses = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const handleExport = () => {
    if (businesses.length === 0) return;

    const csv = convertToCSV(businesses);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `iraq_businesses_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Exported to CSV");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this business?")) return;

    const { error } = await deleteBusiness(id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Deleted");
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse</h1>
          <p className="text-muted-foreground">
            View and manage businesses in Supabase
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={businesses.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-background"
          />
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-background"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {businesses.length} of {totalCount} businesses
      </p>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Location</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Contact</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Quality</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  Loading...
                </td>
              </tr>
            ) : businesses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No businesses found
                </td>
              </tr>
            ) : (
              businesses.map((business) => (
                <tr key={business.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{business.name}</div>
                    {business.name_en && (
                      <div className="text-xs text-muted-foreground">
                        {business.name_en}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{business.category}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {business.city}, {business.governorate}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {business.phone && <div>{business.phone}</div>}
                    {business.website && (
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Website
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        business.data_quality === "real"
                          ? "bg-green-100 text-green-800"
                          : business.data_quality === "partial"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {business.data_quality}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(business.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-secondary rounded hover:bg-secondary/80 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 bg-secondary rounded hover:bg-secondary/80 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function convertToCSV(businesses: Business[]): string {
  const headers = [
    "name",
    "name_en",
    "phone",
    "website",
    "email",
    "address",
    "city",
    "governorate",
    "category",
    "subcategory",
    "latitude",
    "longitude",
    "facebook",
    "instagram",
    "data_quality",
    "verified",
  ];

  const rows = businesses.map((b) => [
    b.name,
    b.name_en || "",
    b.phone || "",
    b.website || "",
    b.email || "",
    b.address || "",
    b.city,
    b.governorate,
    b.category,
    b.subcategory || "",
    b.latitude || "",
    b.longitude || "",
    b.facebook || "",
    b.instagram || "",
    b.data_quality,
    b.verified,
  ]);

  const escapeCSV = (val: unknown) => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  return [headers.join(","), ...rows.map((r) => r.map(escapeCSV).join(","))].join("\n");
}
