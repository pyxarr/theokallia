'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
  useAdminCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  type AdminCoupon,
} from '@/lib/hooks/use-admin-coupons'
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
const SITE_CONFIG_KEYS = ['vipOrderThreshold', 'vipSpendThreshold'] as const

type SiteConfigKey = (typeof SITE_CONFIG_KEYS)[number]

/**
 * The fields the API validates with `@IsInt()`. The money field —
 * `vipSpendThreshold` — may be fractional.
 */
const INTEGER_SITE_CONFIG_KEYS: readonly SiteConfigKey[] = [
  'vipOrderThreshold',
]

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
  }
}

/** A one-line summary of a coupon's terms, for the welcome card. */
function couponTerms(coupon: AdminCoupon): string {
  const amount =
    coupon.type === 'percent'
      ? `${coupon.value}% off`
      : coupon.type === 'fixed'
        ? `NGN ${coupon.value.toLocaleString('en-NG')} off`
        : 'free shipping'
  const parts = [
    amount,
    coupon.scope === 'storewide' ? 'storewide' : `${coupon.scope} scope`,
  ]

  if (coupon.minOrder) {
    parts.push(`minimum order NGN ${coupon.minOrder.toLocaleString('en-NG')}`)
  }
  if (coupon.perUserLimit) {
    parts.push(`${coupon.perUserLimit} use per customer`)
  }
  if (coupon.maxUses) {
    parts.push(`${coupon.maxUses} uses in total`)
  }
  if (coupon.expiresAt) {
    parts.push(`expires ${new Date(coupon.expiresAt).toLocaleDateString('en-NG')}`)
  }

  return parts.join(' · ')
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
  // The welcome offer is one shared coupon row, not a settings column.
  const { data: welcomeCoupons, isPending: isWelcomePending } =
    useAdminCoupons({ source: 'welcome', limit: 1 })
  const { mutateAsync: createCoupon, isPending: isCreatingCoupon } =
    useCreateCoupon()
  const { mutateAsync: updateCoupon, isPending: isUpdatingCoupon } =
    useUpdateCoupon()

  const [form, setForm] = useState<SiteConfigFormValues>({
    vipOrderThreshold: '',
    vipSpendThreshold: '',
  })
  const [welcomeCode, setWelcomeCode] = useState('WELCOME10')
  const [isFormSeeded, setIsFormSeeded] = useState(false)
  // Rates the user has edited but not saved yet, keyed by zone id.
  const [rateDrafts, setRateDrafts] = useState<Record<string, string>>({})
  const [savingZoneId, setSavingZoneId] = useState<string | null>(null)
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false)
  const [zoneName, setZoneName] = useState('')
  const [zoneRate, setZoneRate] = useState('')
  // A new zone is live by default — the admin can uncheck it before
  // saving.
  const [zoneActive, setZoneActive] = useState(true)

  // Seed the form from the loaded settings. Keyed on the query data, so a
  // refetch that returns the same row leaves the typing alone.
  useEffect(() => {
    if (!config) return
    setForm(toFormValues(config))
    setIsFormSeeded(true)
  }, [config])

  const zoneList = zones ?? []

  // Two separate questions, two separate flags:
  //  - is the query in error? The banner says so, even when the last
  //    known values are still on screen — otherwise a failed background
  //    refetch leaves stale rates looking current.
  //  - is there any data at all? Without it the form cards are hidden
  //    and replaced by the error. While the first load is still in flight
  //    there is no data yet either, but the cards are still shown with
  //    skeletons rather than a blank gap.
  const configErrorMessage = isConfigError
    ? errorMessage(configError, 'Could not load settings')
    : null
  const hasConfigData = config !== undefined
  const isConfigLoading =
    isConfigPending || (!isFormSeeded && hasConfigData && !configErrorMessage)
  const zonesErrorMessage = isZonesError
    ? errorMessage(zonesError, 'Could not load shipping zones')
    : null
  // The welcome offer is one shared coupon row. The list is filtered to
  // `source: 'welcome'`, so the first row is the one the API emails.
  const welcomeCoupon = welcomeCoupons?.pages[0]?.data[0]

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

    // The API validates these with `@IsInt()`. A fractional value would
    // be rejected there, and because every field travels in the same
    // request the other valid value would not be saved either — so the
    // offending field is named here instead.
    const notWhole = INTEGER_SITE_CONFIG_KEYS.filter(
      (key) => payload[key] !== undefined && !Number.isInteger(payload[key]),
    )

    if (notWhole.length > 0) {
      toast.error(`Enter a whole number for: ${notWhole.join(', ')}`)
      return
    }

    try {
      await updateConfig(payload)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(errorMessage(err, 'Save failed'))
    }
  }

  /**
   * Creates the shared welcome coupon. The code is editable on purpose: a
   * duplicate code is a 409, and the admin picks another one rather than
   * hitting a dead end.
   */
  const handleCreateWelcomeCoupon = async () => {
    const code = welcomeCode.trim()
    if (code === '') {
      toast.error('Code is required')
      return
    }

    try {
      await createCoupon({
        code,
        type: 'percent',
        value: 10,
        scope: 'storewide',
        minOrder: 20000,
        perUserLimit: 1,
        maxUses: null,
        expiresAt: null,
        active: true,
        source: 'welcome',
        autoIssue: true,
      })
      toast.success('Welcome coupon created')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not create the welcome coupon'))
    }
  }

  /**
   * The API only writes `autoIssue` when the body carries it, so this
   * patch leaves every other field of the coupon alone.
   */
  const toggleWelcomeAutoIssue = async (autoIssue: boolean) => {
    if (!welcomeCoupon) return

    try {
      await updateCoupon({
        id: welcomeCoupon.id,
        input: { autoIssue },
      })
      toast.success(
        autoIssue
          ? 'Welcome coupon emailed at signup'
          : 'Welcome coupon not emailed at signup',
      )
    } catch (err) {
      toast.error(errorMessage(err, 'Update failed'))
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
    setZoneActive(true)
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
      await createZone({ name, rate, active: zoneActive })
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
            Global thresholds, the welcome coupon, and shipping rates.
          </p>
        </div>
        <Button
          onClick={() => void handleSave()}
          disabled={isSaving || isConfigLoading || !hasConfigData}
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

      {(hasConfigData || isConfigLoading) && (
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
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Welcome coupon</CardTitle>
          <CardDescription>
            One shared code for the welcome offer: promoted publicly and
            emailed to every new customer at signup. The per-user limit
            caps each customer at one use.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isWelcomePending ? (
            <Skeleton className="h-8 w-full" />
          ) : welcomeCoupon ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{welcomeCoupon.code}</span>
                <Badge
                  variant={welcomeCoupon.active ? 'default' : 'secondary'}
                >
                  {welcomeCoupon.active ? 'Active' : 'Inactive'}
                </Badge>
                <Button
                  variant="outline"
                  render={<Link href={`/coupons/${welcomeCoupon.id}/edit`} />}
                >
                  Edit coupon
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {couponTerms(welcomeCoupon)}
              </p>
              <div className="flex flex-col gap-2">
                {/* The id matches the id base-ui puts on the checkbox's
                    `aria-labelledby`, so the box is named by the label. */}
                <Label
                  htmlFor="welcomeAutoIssue"
                  id="welcomeAutoIssue-label"
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    id="welcomeAutoIssue"
                    checked={welcomeCoupon.autoIssue}
                    onCheckedChange={(checked) =>
                      void toggleWelcomeAutoIssue(checked)
                    }
                    disabled={isUpdatingCoupon}
                  />
                  Email to new customers when they sign up
                </Label>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                No welcome coupon yet. Create one to start the offer.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="welcomeCode">Code</Label>
                  <Input
                    id="welcomeCode"
                    value={welcomeCode}
                    onChange={(event) => setWelcomeCode(event.target.value)}
                  />
                </div>
                <Button
                  onClick={() => void handleCreateWelcomeCoupon()}
                  disabled={isCreatingCoupon}
                >
                  {isCreatingCoupon ? 'Creating…' : 'Create welcome coupon'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
          {zonesErrorMessage && zoneList.length > 0 && (
            <p
              role="alert"
              className="mb-4 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive"
            >
              {zonesErrorMessage} The rates below are the last ones that
              loaded.
            </p>
          )}
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
              {!isZonesPending &&
                zonesErrorMessage &&
                zoneList.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-destructive"
                    >
                      <p role="alert">{zonesErrorMessage}</p>
                    </TableCell>
                  </TableRow>
                )}
              {!isZonesPending &&
                !zonesErrorMessage &&
                zoneList.length === 0 && (
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
              Create a delivery zone with a flat NGN rate. A new zone
              applies to no state until states are mapped to it — the
              state mapping is seeded by the API&apos;s seed:zones script,
              not by this page.
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
            <div className="flex flex-col gap-2">
              {/* The id matches the id base-ui puts on the checkbox's
                  `aria-labelledby`, so the box is named "Active". */}
              <Label
                htmlFor="zoneActive"
                id="zoneActive-label"
                className="flex items-center gap-2"
              >
                <Checkbox
                  id="zoneActive"
                  checked={zoneActive}
                  onCheckedChange={(checked) => setZoneActive(checked)}
                />
                Active
              </Label>
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
