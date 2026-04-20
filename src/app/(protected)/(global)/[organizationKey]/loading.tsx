import { Spinner } from "@components/ui/spinner";

export default function WorkspacePageLoading() {
  return (
    <div className="fixed inset-0 z-10 flex h-full w-full items-center justify-center">
      <Spinner className="size-10" />
    </div>
  );
}
