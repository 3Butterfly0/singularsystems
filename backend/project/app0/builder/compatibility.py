from django.db.models import QuerySet
from app0.models import BuildSession, intelCPU, amdCPU, intelMotherboard, amdMotherboard, ram, psu

class CompatibilityEngine:
    """
    Core business logic rules for dynamic hardware compatibility inside Singular Systems builder.
    """

    @staticmethod
    def get_compatible_cpus(session: BuildSession) -> dict:
        """Returns compatible CPUs across platforms if not chosen, or just the chosen platform."""
        res = {'intel': intelCPU.objects.all(), 'amd': amdCPU.objects.all()}
        
        if session.platform == 'intel':
            res['amd'] = amdCPU.objects.none()
            if session.intel_motherboard and session.intel_motherboard.socket:
                res['intel'] = res['intel'].filter(socket=session.intel_motherboard.socket)
        elif session.platform == 'amd':
            res['intel'] = intelCPU.objects.none()
            if session.amd_motherboard and session.amd_motherboard.socket:
                res['amd'] = res['amd'].filter(socket=session.amd_motherboard.socket)
        
        return res

    @staticmethod
    def get_compatible_motherboards(session: BuildSession) -> dict:
        """Returns compatible Motherboards based on selected CPU and RAM."""
        res = {'intel': intelMotherboard.objects.all(), 'amd': amdMotherboard.objects.all()}
        
        if session.platform == 'intel':
            res['amd'] = amdMotherboard.objects.none()
            if session.intel_cpu and session.intel_cpu.socket:
                res['intel'] = res['intel'].filter(socket=session.intel_cpu.socket)
            if session.ram and getattr(session.ram, 'ram_type', None):
                res['intel'] = res['intel'].filter(ram_type=session.ram.ram_type)

        elif session.platform == 'amd':
            res['intel'] = intelMotherboard.objects.none()
            if session.amd_cpu and session.amd_cpu.socket:
                res['amd'] = res['amd'].filter(socket=session.amd_cpu.socket)
            if session.ram and getattr(session.ram, 'ram_type', None):
                res['amd'] = res['amd'].filter(ram_type=session.ram.ram_type)

        return res

    @staticmethod
    def get_compatible_ram(session: BuildSession) -> QuerySet:
        qs = ram.objects.all()
        mb = session.intel_motherboard if session.platform == 'intel' else session.amd_motherboard
        if mb and getattr(mb, 'ram_type', None):
            qs = qs.filter(ram_type=mb.ram_type)
        return qs

    @staticmethod
    def get_compatible_psus(session: BuildSession) -> QuerySet:
        # Require 20% headroom
        min_required_watts = session.estimated_watts * 1.2
        return psu.objects.filter(wattage__gte=min_required_watts)

    @staticmethod
    def get_validation_errors(session: BuildSession) -> list:
        """Runs the validation logic across the entire BuildSession returning human-readable errors."""
        errors = []
        
        cpu = session.intel_cpu if session.platform == 'intel' else session.amd_cpu
        mb = session.intel_motherboard if session.platform == 'intel' else session.amd_motherboard
        
        # 1. Socket Matching Validation
        if cpu and mb:
            # Sockets might be None defensively
            cpu_socket = getattr(cpu, 'socket', None)
            mb_socket = getattr(mb, 'socket', None)
            
            if cpu_socket and mb_socket and cpu_socket != mb_socket:
                errors.append(f"Incompatible Socket: CPU has {cpu_socket}, Motherboard requires {mb_socket}.")
        
        # 2. RAM Type Validation
        if mb and session.ram:
            mb_ram = getattr(mb, 'ram_type', None)
            sys_ram = getattr(session.ram, 'ram_type', None)
            
            if mb_ram and sys_ram and mb_ram != sys_ram:
                errors.append(f"Incompatible RAM: Motherboard supports {mb_ram}, RAM is {sys_ram}.")
        
        # 3. PSU Validation
        if session.psu:
            min_required = session.estimated_watts * 1.2
            if session.psu.wattage < min_required:
                errors.append(f"Insufficient Power: System requires at least {int(min_required)}W with headroom, but PSU only provides {session.psu.wattage}W.")
                
        return errors
