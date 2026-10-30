import { useState } from "react";
import { MapPin } from "lucide-react";
import Button from "../Button";
import { Input } from "../Input";
import { Label } from "../Label";
import { Select } from "../Select";
import { useBranch } from "../../contexts/useBranch";
import type { Branch } from "../../types/type";

export function BranchSelector() {
  const { branches, selectedBranch, setSelectedBranch } = useBranch();
  const [query, setQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const defaultBranch =
    branches.find((branch) => branch.isDefault) ??
    branches.find((branch) => branch.name === "main") ??
    branches[0] ??
    null;
  const selectedBranchId = branches.some(
    (branch) => branch.id === selectedBranch?.id,
  )
    ? selectedBranch?.id ?? ""
    : "";
  const matchingBranches = branches.filter((branch) =>
    `${branch.name} ${branch.code ?? ""} ${branch.address ?? ""}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const visibleBranches =
    selectedBranch &&
    !matchingBranches.some((branch) => branch.id === selectedBranch.id)
      ? [selectedBranch, ...matchingBranches]
      : matchingBranches;

  function handleUseLocation() {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Location is not supported by this browser.");
      return;
    }

    const locatedBranches = branches.filter(hasCoordinates);
    if (!locatedBranches.length) {
      setLocationError("Branch locations are not available yet.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nearestBranch = locatedBranches.reduce((nearest, branch) => {
          const distance = getDistanceInKm(
            coords.latitude,
            coords.longitude,
            branch.latitude,
            branch.longitude,
          );
          return distance < nearest.distance
            ? { branch, distance }
            : nearest;
        }, {
          branch: locatedBranches[0],
          distance: Number.POSITIVE_INFINITY,
        });
        setSelectedBranch(nearestBranch.branch, true);
        setIsLocating(false);
      },
      (error) => {
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. You can still choose a branch manually."
            : error.code === error.TIMEOUT
              ? "Finding your location timed out. Please try again."
              : "Your location is unavailable. You can still choose a branch manually.",
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return (
    <div className="grid gap-4">
      <Label label="Branch">
        <Select
          aria-label="Select branch"
          value={selectedBranchId}
          disabled={branches.length <= 1}
          placeholder={
            branches.length ? "Select a branch" : "No branches available"
          }
          options={visibleBranches.map((branch) => ({
            value: branch.id,
            label: `${branch.name}${branch.isDefault ? " (default)" : ""}`,
          }))}
          onChange={(event) => {
            const branch = branches.find(
              (item) => item.id === event.currentTarget.value,
            );
            if (branch) setSelectedBranch(branch);
          }}
        />
      </Label>
      <div>
        <Button
          type="button"
          variant="tertiary"
          onClick={handleUseLocation}
          disabled={isLocating || !branches.length}
        >
          <MapPin aria-hidden="true" size={16} />
          {isLocating ? "Finding nearby branch..." : "Use my location"}
        </Button>
      </div>
      <div>
        <Button
          type="button"
          variant="tertiary"
          onClick={() => setSelectedBranch(defaultBranch)}
          disabled={
            !defaultBranch || defaultBranch.id === selectedBranch?.id
          }
        >
          Use default branch
        </Button>
      </div>
      {locationError && (
        <p className="text-sm text-status-error" role="alert">
          {locationError}
        </p>
      )}
    </div>
  );
}

function getDistanceInKm(
  latitude: number,
  longitude: number,
  branchLatitude: number,
  branchLongitude: number,
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDifference = toRadians(branchLatitude - latitude);
  const longitudeDifference = toRadians(branchLongitude - longitude);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(latitude)) *
      Math.cos(toRadians(branchLatitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function hasCoordinates(
  branch: Branch,
): branch is Branch & { latitude: number; longitude: number } {
  return (
    Number.isFinite(branch.latitude) && Number.isFinite(branch.longitude)
  );
}