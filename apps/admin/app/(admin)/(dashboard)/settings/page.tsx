'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useCreateShippingZone,
  useShippingZones,
  useSiteConfig,
  useUpdateShippingZone,
  useUpdateSiteConfig,
  type SiteConfig,
  type SiteConfigInput,
  type ShippingZone,
} from '@/lib/hooks/use-admin-settings'
import { errorMessage } from '@/lib/utils'

/** The SiteConfig fields the PATCH body accepts. */
const SITE_CONFIG_KEYS = [
  'vipOrderThreshold',
  'vipSpendThreshold',
  'welcomeDiscountPercent',
  'welcomeDiscountMinOrder',
  'welcomeDiscountExpiry',
] as const

type SiteConfigKey = (typeof SITE_CONFIG_KEYS)[number]

/**
 * The editable values are held as strings so a field can be cleared while
 * typing; the numbers are parsed on save.
 */
type SiteConfigFormValues = Record<SiteConfigKey, string>

/** Turns the stored settings row into the editable form values. */
function toFormValues(config: SiteConfig): SiteConfigFormValues {
  return {
    vipOrderThreshold: String(config.vipOrderThreshold),
    vipSpendThreshold: String(config.vipSpendThreshold),
    welcomeDiscountPercent: String(config.welcomeDiscountPercent),
    welcomeDiscountMinOrder: String(config.welcomeDiscountMinOrder),
    welcomeDiscountExpiry: String(config.welcomeDiscountExpiry),
  }
}

export default function SettingsPage() {
  const {
    data: config,
    isPending: isConfigPending,
    isError: isConfigError,
    error: configError,
  } = useSiteConfig()
  const {
    data: zones,
    isPending: isZonesPending,
    isError: isZonesError,
    error: zonesError,
  } = useShippingZones()
  const { mutateAsync: updateConfig, isPending: isSaving } =
    useUpdateSiteConfig()
  const { mutateAsync: updateZone, isPending: isUpdatingZone } =
    useUpdateShippingZone()
  const { mutateAsync: createZone, isPending: isCreatingZone } =
    useCreateShippingZone()

  const [form, setForm] = useState<SiteConfigFormValues>({
    vipOrderThreshold: '',
    vipSpendThreshold: '',
    welcomeDiscountPercent: '',
    welcomeDiscountMinOrder: '',
    welcomeDiscountExpiry: '',
  })
  const [isFormSeeded, setIsFormSeeded] = useState(false)
  // Rates the user has edited but not saved yet, keyed by zone id.
  const [rateDrafts, setRateDrafts] = useState<Record<string, string>>({})
  const [savingZoneId, setSavingZoneId] = useState<string | null>(null)
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false)
  const [zoneName, setZoneName] = useState('')
  const [zoneRate, setZoneRate] = useState('')

  // Seed the form from the loaded settings. Keyed on the query data, so a
  // refetch that returns the same row leaves the typing alone.
  useEffect(() => {
    if (!config) return
    setForm(toFormValues(config))
    setIsFormSeeded(true)
  }, [config])

  const zoneList = zones ?? []

  // A failed query never produces data, so the form can never be seeded.
  // That is an error, not a loading state: without this the page would sit
  // on skeletons forever with a dead Save button.
  const configErrorMessage =
    isConfigError && !config
      ? errorMessage(configError, 'Could not load settings')
      : null
  const isConfigLoading =
    isConfigPending || (!isFormSeeded && configErrorMessage === null)
  const zonesErrorMessage =
    isZonesError && zoneList.length === 0
      ? errorMessage(zonesError, 'Could not load shipping zones')
      : null

  const handleSave = async () => {
    const payload: SiteConfigInput = {}
    const invalid: SiteConfigKey[] = []

    for (const key of SITE_CONFIG_KEYS) {
      const raw = form[key].trim()
      // A cleared field is left out of the payload: the API rejects a blank
      // string, and `Number('') === 0` would overwrite the stored value.
      if (raw === '') continue
      const value = Number(raw)
      if (!Number.isFinite(value)) {
        invalid.push(key)
        continue
      }
      payload[key] = value
    }

    if (invalid.length > 0) {
      toast.error(`Enter a valid number for: ${invalid.join(', ')}`)
      return
    }

    try {
      await updateConfig(payload)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(errorMessage(err, 'Save failed'))
    }
  }

  const saveZoneRate = async (zone: ShippingZone) => {
    const raw = (rateDrafts[zone.id] ?? String(zone.rate)).trim()
    if (raw === '') {
      toast.error('Rate is required')
      return
    }
    const rate = Number(raw)
    if (!Number.isFinite(rate)) {
      toast.error('Rate must be a number')
      return
    }

    setSavingZoneId(zone.id)
    try {
      const updated = await updateZone({ id: zone.id, input: { rate } })
      setRateDrafts((prev) => ({ ...prev, [zone.id]: String(updated.rate) }))
      toast.success(`${zone.name} rate updated`)
    } catch (err) {
      toast.error(errorMessage(err, 'Update failed'))
    } finally {
      setSavingZoneId(null)
    }
  }

  const toggleZone = async (zone: ShippingZone, active: boolean) => {
    try {
      await updateZone({ id: zone.id, input: { active } })
      toast.success(`${zone.name} ${active ? 'activated' : 'deactivated'}`)
    } catch (err) {
      toast.error(errorMessage(err, 'Update failed'))
    }
  }

  const closeZoneDialog = () => {
    setIsZoneDialogOpen(false)
    setZoneName('')
    setZoneRate('')
  }

  const handleCreateZone = async () => {
    const name = zoneName.trim()
    if (name === '') {
      toast.error('Zone name is required')
      return
    }
    const rate = Number(zoneRate.trim())
    if (zoneRate.trim() === '' || !Number.isFinite(rate)) {
      toast.error('Rate must be a number')
      return
    }

    try {
      await createZone({ name, rate })
      toast.success(`${name} added`)
      closeZoneDialog()
    } catch (err) {
      toast.error(errorMessage(err, 'Create failed'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-le-jour text-3xl tracking-wide uppercase">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Global thresholds, welcome discounts, and shipping rates.
          </p>
        </div>
        <Button
          onClick={() => void handleSave()}
          disabled={isSaving || isConfigLoading || configErrorMessage !== null}
        >
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      {configErrorMessage && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {configErrorMessage}
        </p>
      )}

      {configErrorMessage === null && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>VIP thresholds</CardTitle>
              <CardDescription>
                Customers are promoted to VIP once they cross either threshold.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {isConfigLoading ? (
                <>
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vipOrderThreshold">
                      Order count threshold
                    </Label>
                    <Input
                      id="vipOrderThreshold"
                      type="number"
                      min={0}
                      step={1}
                      value={form.vipOrderThreshold}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          vipOrderThreshold: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vipSpendThreshold">
                      Lifetime spend threshold (NGN)
                    </Label>
                    <Input
                      id="vipSpendThreshold"
                      type="number"
                      min={0}
                      step="any"
                      value={form.vipSpendThreshold}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          vipSpendThreshold: event.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Welcome discount</CardTitle>
              <CardDescription>
                Applied to new customers through a single-use welcome coupon.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {isConfigLoading ? (
                <>
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="welcomeDiscountPercent">
                      Discount percent
                    </Label>
                    <Input
                      id="welcomeDiscountPercent"
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={form.welcomeDiscountPercent}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          welcomeDiscountPercent: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="welcomeDiscountMinOrder">
                      Minimum order (NGN)
                    </Label>
                    <Input
                      id="welcomeDiscountMinOrder"
                      type="number"
                      min={0}
                      step="any"
                      value={form.welcomeDiscountMinOrder}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          welcomeDiscountMinOrder: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="welcomeDiscountExpiry">
                      Expires after (days)
                    </Label>
                    <Input
                      id="welcomeDiscountExpiry"
                      type="number"
                      min={1}
                      step={1}
                      value={form.welcomeDiscountExpiry}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          welcomeDiscountExpiry: event.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Shipping zone rates</CardTitle>
            <CardDescription>
              Flat NGN rate applied to each delivery zone.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => setIsZoneDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add zone
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone</TableHead>
                <TableHead>Rate (NGN)</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isZonesPending && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    Loading zones…
                  </TableCell>
                </TableRow>
              )}
              {!isZonesPending && zonesErrorMessage && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-destructive"
                  >
                    <p role="alert">{zonesErrorMessage}</p>
                  </TableCell>
                </TableRow>
              )}
              {!isZonesPending && !zonesErrorMessage && zoneList.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No shipping zones yet.
                  </TableCell>
                </TableRow>
              )}
              {zoneList.map((zone) => {
                const draft = rateDrafts[zone.id]
                const isSavingRow = savingZoneId === zone.id
                const hasRateChanged =
                  draft !== undefined && draft !== String(zone.rate)

                return (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          className="w-28"
                          aria-label={`Rate for ${zone.name}`}
                          value={draft ?? String(zone.rate)}
                          onChange={(event) =>
                            setRateDrafts((prev) => ({
                              ...prev,
                              [zone.id]: event.target.value,
                            }))
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Save rate for ${zone.name}`}
                          disabled={!hasRateChanged || isUpdatingZone}
                          onClick={() => void saveZoneRate(zone)}
                        >
                          {isSavingRow ? 'Saving…' : 'Save'}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={zone.active}
                        onCheckedChange={(checked) =>
                          void toggleZone(zone, checked)
                        }
                        aria-label={`Toggle ${zone.name}`}
                        disabled={isUpdatingZone}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={isZoneDialogOpen}
        onOpenChange={(open) => !open && closeZoneDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add shipping zone</DialogTitle>
            <DialogDescription>
              Create a delivery zone with a flat NGN rate.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="zoneName">Zone name</Label>
              <Input
                id="zoneName"
                placeholder="Nationwide"
                value={zoneName}
                onChange={(event) => setZoneName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="zoneRate">Rate (NGN)</Label>
              <Input
                id="zoneRate"
                type="number"
                min={0}
                step="any"
                value={zoneRate}
                onChange={(event) => setZoneRate(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeZoneDialog}
              disabled={isCreatingZone}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreateZone()}
              disabled={isCreatingZone}
            >
              {isCreatingZone ? 'Adding…' : 'Add zone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
