import JobList from "@/components/jobs/JobList";

interface Props {
  searchParams: { status?: string };
}

export default function JobsPage({ searchParams }: Props) {
  return <JobList defaultStatus={searchParams.status ?? ""} />;
}
