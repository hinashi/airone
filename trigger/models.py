from django.db import models

from airone.exceptions.trigger import InvalidInputException
from airone.lib.types import AttrTypeValue
from acl.models import ACLBase
from entity.models import Entity, EntityAttr
from entry.models import Entry, Attribute


## These are internal classes for AirOne trigger and action
class InputTriggerCondition(object):
    def __init__(self, **input):
        # set EntityAttr from "attr" parameter of input
        attr_id = input.get("attr_id", 0)
        self.attr = EntityAttr.objects.filter(id=attr_id, is_active=True).first()
        if not self.attr:
            raise InvalidInputException("Specified attr(%s) is invalid" % attr_id)

        self.str_cond = input.get("str_cond", "")

        ref_id = input.get("ref_cond", None)
        self.ref_cond = None
        if ref_id:
            self.ref_cond = Entry.objects.filter(id=ref_id, is_active=True).first()
            if not self.ref_cond:
                raise InvalidInputException("Specified referral Entry(%s) is invalid" % ref_id)

        self.bool_cond = input.get("bool_cond", False)


class InputTriggerActionValue(object):
    def __init__(self, **input):
        self.str_cond = input.get("str_cond", "")
        self.ref_cond = input.get("ref_cond", None)
        self.bool_cond = input.get("bool_cond", False)


class InputTriggerAction(object):
    def __init__(self, **input):
        # set EntityAttr from "attr" parameter of input
        attr_id = input.get("attr_id", 0)
        self.attr = EntityAttr.objects.filter(id=attr_id, is_active=True).first()
        if not self.attr:
            raise InvalidInputException("Specified attr(%s) is invalid" % attr_id)

        self.values = []

        value = self.get_value(input.get("value"))
        if isinstance(value, list):
            self.values = value
        elif isinstance(value, InputTriggerActionValue):
            self.values.append(value)

    def get_value(self, input_value):
        if isinstance(input_value, str):
            return InputTriggerActionValue(str_cond=input_value)
        elif isinstance(input_value, bool):
            return InputTriggerActionValue(bool_cond=input_value)
        elif isinstance(input_value, Entry):
            return InputTriggerActionValue(ref_cond=input_value)
        elif isinstance(input_value, int):
            return InputTriggerActionValue(
                ref_cond=Entry.objects.filter(id=input_value, is_active=True).first()
            )
        elif isinstance(input_value, dict):
            ref_entry = None
            if isinstance(input_value.get("id"), int):
                ref_entry = Entry.objects.filter(id=input_value["id"], is_active=True).first()
            if isinstance(input_value.get("id"), str):
                ref_entry = Entry.objects.filter(id=int(input_value["id"]), is_active=True).first()
            elif isinstance(input_value.get("id"), Entry):
                ref_entry = input_value["id"]

            return InputTriggerActionValue(
                str_cond=input_value["name"],
                ref_cond=ref_entry,
            )
        elif isinstance(input_value, list):
            return [self.get_value(x) for x in input_value if x]


class TriggerAction(models.Model):
    condition = models.ForeignKey(
        "TriggerParentCondition", on_delete=models.CASCADE, related_name="actions"
    )
    attr = models.ForeignKey("entity.EntityAttr", on_delete=models.CASCADE)

    def save_actions(self, input: InputTriggerAction):
        for input_action_value in input.values:
            params = {
                "action": self,
                "str_cond": input_action_value.str_cond,
                "ref_cond": input_action_value.ref_cond,
                "bool_cond": input_action_value.bool_cond,
            }
            TriggerActionValue.objects.create(**params)


class TriggerActionValue(models.Model):
    action = models.ForeignKey(TriggerAction, on_delete=models.CASCADE, related_name="values")
    str_cond = models.TextField()
    ref_cond = models.ForeignKey("entry.Entry", on_delete=models.SET_NULL, null=True, blank=True)
    bool_cond = models.BooleanField(default=False)

    # TODO: Add method to register value to Attribute when action is invoked


class TriggerParentCondition(models.Model):
    entity = models.ForeignKey("entity.Entity", on_delete=models.CASCADE)

    def is_match_condition(self, inputs: list[InputTriggerCondition]):
        if all([c.is_same_condition(inputs) for c in self.co_condition.all()]):
            return True
        return False

    def save_conditions(self, inputs: list[InputTriggerCondition]):
        for input_cond in inputs:
            params = {
                "parent": self,
                "attr": input_cond.attr,
                "str_cond": input_cond.str_cond,
                "ref_cond": input_cond.ref_cond,
                "bool_cond": input_cond.bool_cond,
            }
            if not TriggerCondition.objects.filter(**params).exists():
                TriggerCondition.objects.create(**params)

    def get_actions(self, recv_attrs: list) -> list[TriggerAction]:
        """
        This method checks whether specified entity's Trigger is invoked by recv_attrs context.
        The recv_attrs format should be compatible with APIv2 standard.

        TODO:
        It's necessary to expand APIv2 implementation to pass EntityAttr ID in the recv_attrs
        context to reduce DB query to get it from Attribute instance.
        """
        def _is_match(condition):
            for attr_info in [x for x in recv_attrs if x["attr_schema_id"] == condition.attr.id]:
                if condition.is_match_condition(attr_info["value"]):
                    return True

            return False

        if all([_is_match(c) for c in self.co_conditions.filter(attr__is_active=True)]):
            # In this case, all recv_attrs are matched with configured TriggerCondition,
            # then return corresponding TriggerAction.
            return list(TriggerAction.objects.filter(condition=self))

        else:
            return []


class TriggerCondition(models.Model):
    parent = models.ForeignKey(
        TriggerParentCondition, on_delete=models.CASCADE, related_name="co_conditions"
    )
    attr = models.ForeignKey("entity.EntityAttr", on_delete=models.CASCADE)
    str_cond = models.TextField()
    ref_cond = models.ForeignKey("entry.Entry", on_delete=models.SET_NULL, null=True, blank=True)
    bool_cond = models.BooleanField(default=False)

    def is_same_condition(self, input_list: list[InputTriggerCondition]) -> bool:
        # This checks one of the InputCondition which is in input_list matches with this condition
        def _do_check_condition(input: InputTriggerCondition):
            if self.attr.id == input.attr.id:
                if self.attr.type & AttrTypeValue["boolean"]:
                    return self.bool_cond == input.bool_cond

                elif self.attr.type & AttrTypeValue["object"]:
                    return self.ref_cond == input.ref_cond

                elif self.attr.type & AttrTypeValue["string"]:
                    return self.str_cond == input.str_cond

            return False

        return any([_do_check_condition(input) for input in input_list])

    def is_match_condition(self, recv_value) -> bool:
        """
        This checks specified value, which is compatible with APIv2 standard, matches with this condition.
        """
        # This is a helper method when AttrType is "object" or "named_object"
        def _is_match_object(val):
            if isinstance(val, int) or isinstance(val, str):
                return self.ref_cond.id == int(val)

            elif isinstance(val, Entry) or isinstance(val, ACLBase):
                return self.ref_cond.id == val.id

        if self.attr.type & AttrTypeValue["array"]:
            return any([self.is_match_condition(x) for x in recv_value])

        elif self.attr.type & AttrTypeValue["named_object"]:
            return _is_match_object(recv_value["id"]) and self.str_cond == recv_value["name"]

        elif self.attr.type & AttrTypeValue["object"]:
            return _is_match_object(recv_value)

        elif self.attr.type & AttrTypeValue["string"]:
            return self.str_cond == recv_value

        elif self.attr.type & AttrTypeValue["boolean"]:
            return self.bool_cond == recv_value


    @classmethod
    def register(cls, entity: Entity, conditions: list, actions: list) -> TriggerParentCondition:
        # convert input to InputTriggerCondition
        input_trigger_conditions = [InputTriggerCondition(**condition) for condition in conditions]

        # check if condition is already registered
        for parent_condition in TriggerParentCondition.objects.filter(entity=entity):
            # This prevents to registering exactly same condition that have already been registered
            if parent_condition.is_match_condition(input_trigger_conditions):
                raise InvalidInputException(
                    "There is condition that have same condition with specified one"
                )

        # register specified condition as AirOne TriggerCondition
        parent_condition = TriggerParentCondition.objects.create(entity=entity)
        parent_condition.save_conditions(input_trigger_conditions)

        # convert input to InputTriggerCondition
        for action in actions:
            input_trigger_action = InputTriggerAction(**action)
            trigger_action = TriggerAction.objects.create(
                condition=parent_condition, attr=input_trigger_action.attr
            )
            trigger_action.save_actions(input_trigger_action)

        return parent_condition