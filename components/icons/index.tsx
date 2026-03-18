/**
 * Central icon exports — all icons come from lucide-react.
 * To swap or add an icon, change only this file.
 *
 * Usage: import { HomeIcon, PlusIcon } from "@/components/icons"
 */

export {
  // Navigation & UI
  LogOut as LogOutIcon,
  Home as HomeIcon,
  Clock as ClockIcon,
  BarChart2 as BarChartIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronDown as ChevronDownIcon,
  Plus as PlusIcon,
  Check as CheckIcon,
  CheckCircle2 as CheckCircleIcon,
  XCircle as XCircleIcon,
  Trash2 as TrashIcon,
  Pencil as PencilIcon,
  Info as InfoIcon,
  // Users
  User as UserIcon,
  UserRound as CaregiverIcon,
  // Baby & feeding
  Baby as BabyIcon,
  Milk as BottleMilkIcon,
  Droplet as DropletIcon,
  Droplets as DropletsIcon,
  Moon as MoonIcon,
  Toilet as ToiletIcon,
  Sprout as SproutIcon,
  CirclePile as CirclePileIcon,
  // Growth
  TrendingUp as TrendUpIcon,
  Scale as ScaleIcon,
  Ruler as RulerIcon,
  Brain as BrainIcon,
  Weight as WeightIcon,
  // Medical
  HeartPulse as HeartPulseIcon,
  Stethoscope as StethoscopeIcon,
  Syringe as SyringeIcon,
  CalendarDays as CalendarIcon,
  ClipboardList as ClipboardIcon,
  Building2 as HospitalIcon,
  // Profile & sharing
  KeyRound as KeyIcon,
  Link2 as LinkIcon,
  // Sleep
  Bed as BedIcon,
  // Pumping tracker
  Zap as ZapIcon,
  Heart as HeartIcon,
  Activity as ActivityIcon,
  AlertCircle as AlertCircleIcon,
  CircleDot as CircleDotIcon,
  Feather as FeatherIcon,
  Frown as FrownIcon,
  Smile as SmileIcon,
  Thermometer as ThermometerIcon,
  Snowflake as SnowflakeIcon,
  Lightbulb as LightbulbIcon,
  Timer as TimerIcon,
  Play as PlayIcon,
  Square as SquareIcon,
  X as XIcon,
  Save as SaveIcon,
  ChevronRight as ChevronRightIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  Tag as TagIcon,
} from "lucide-react";

export function svgProps(size: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export type IconProps = {
  size?: number;
  className?: string;
};

export function BreastPumpIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...svgProps(size)} className={className}>
      <path
        d="M11.2143 22H13.7857C15.3951 22 16.1998 22 16.747 21.5637C16.8641 21.4703 16.9703 21.3641 17.0637 21.247C17.5 20.6998 17.5 19.8951 17.5 18.2857V14C17.5 11.2386 15.2614 9 12.5 9C9.73858 9 7.5 11.2386 7.5 14V18.2857C7.5 19.8951 7.5 20.6998 7.93634 21.247C8.02971 21.3641 8.13594 21.4703 8.25302 21.5637C8.80017 22 9.60488 22 11.2143 22Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M15 14H17.5M15 18H17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M12.5 9V6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <path
        d="M15 6H9C8.51194 6 8.26792 6 8.03739 6.02684C7.10692 6.13518 6.24399 6.56665 5.59904 7.24602C5.43925 7.41433 5.29283 7.60956 5 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
      <circle
        cx="4.5"
        cy="9.5"
        r="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      ></circle>
      <path
        d="M15 5.99954C16.0195 5.49103 17.5998 4.17647 18.3402 3.29011C18.8693 2.6567 19.5 2 21 2V10C19.5 10 18.8693 9.34284 18.3402 8.70943C17.5998 7.82307 16.0195 6.50805 15 5.99954Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
}

export function PoopIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...svgProps(size)} className={className}>
      <path
        d="M181.32,118.14c1.413-3.498,2.154-7.265,2.154-11.129c0-14.286-10.129-26.25-23.582-29.092
	c0.419-2.386,0.663-4.808,0.729-7.255l0.009-0.283c0.012-0.357,0.022-0.713,0.022-1.073c0-0.358-0.011-0.714-0.022-1.071
	l-0.009-0.276c-0.348-12.914-5.636-25-14.893-34.029c-9.276-9.05-21.523-14.034-34.485-14.034c-4.142,0-7.5,3.358-7.5,7.5
	s3.358,7.5,7.5,7.5c1.289,0,2.337,1.049,2.337,2.338c0,1.29-1.049,2.34-2.338,2.34H68.832c-16.394,0-29.731,13.338-29.731,29.732
	c0,2.872,0.408,5.689,1.196,8.379c-14.057,2.355-24.803,14.608-24.803,29.323c0,3.864,0.741,7.631,2.153,11.128
	C7.103,123.491,0,134.448,0,146.865c0,17.757,14.446,32.203,32.202,32.203h134.563c17.756,0,32.202-14.446,32.202-32.203
	C198.967,134.45,191.863,123.493,181.32,118.14z M68.832,54.577h42.411c8.815,0,16.115-6.615,17.199-15.142
	c10.047,5.753,16.85,16.444,17.185,28.939l0.012,0.361c0.006,0.191,0.014,0.382,0.014,0.574c0,0.192-0.008,0.383-0.014,0.574
	l-0.012,0.367c-0.064,2.388-0.378,4.738-0.92,7.029h-88.26c-1.526-2.359-2.348-5.108-2.348-7.971
	C54.101,61.186,60.709,54.577,68.832,54.577z M45.226,92.28h7.649h97.317h3.549c8.124,0,14.733,6.608,14.733,14.731
	c0,2.809-0.797,5.512-2.272,7.847H32.765c-1.475-2.334-2.271-5.038-2.271-7.847C30.494,98.888,37.103,92.28,45.226,92.28z
	 M166.765,164.068H32.202c-9.485,0-17.202-7.717-17.202-17.203c0-8.555,6.313-15.8,14.733-17.007h139.498
	c8.422,1.207,14.735,8.453,14.735,17.007C183.967,156.351,176.25,164.068,166.765,164.068z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
}
