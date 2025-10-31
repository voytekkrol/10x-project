import React from "react";

interface Props {
  sort: "created_at" | "-created_at";
  onChangeSort: (s: "created_at" | "-created_at") => void;
}

export default function SortControl({ sort, onChangeSort }: Props): JSX.Element {
  return (
    <div className="flex flex-col sm:ml-auto w-full sm:w-44">
      <label htmlFor="sort" className="text-sm font-medium">
        Sort
      </label>
      <select
        id="sort"
        className="border rounded-md px-3 py-2 text-sm"
        value={sort}
        onChange={(e) => onChangeSort(e.target.value as Props["sort"])}
      >
        <option value="-created_at">Newest</option>
        <option value="created_at">Oldest</option>
      </select>
    </div>
  );
}
